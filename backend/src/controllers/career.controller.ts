import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError, sendCreated } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

// Career Activities
const activityCrud = createCrudController({
  model: 'careerActivity',
  include: {
    project: true,
    jobApplication: true,
    logs: { orderBy: { date: 'desc' } }
  },
  orderBy: { date: 'desc' },
  searchFields: ['targetEntity', 'description', 'outputSummary'],
});

export const createCareerActivity = activityCrud.create;
export const getAllCareerActivities = activityCrud.getAll;
export const getCareerActivityById = activityCrud.getOne;
export const updateCareerActivity = activityCrud.update;
export const deleteCareerActivity = activityCrud.delete;

// Activity Logs
export const getActivityLogs = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { activityId } = req.params;

    // Verify the activity belongs to the user
    const activity = await prisma.careerActivity.findFirst({
      where: { id: activityId, userId },
    });

    if (!activity) {
      sendError(res, 'Activity not found', 404);
      return;
    }

    const logs = await prisma.careerActivityLog.findMany({
      where: { activityId, userId },
      orderBy: { date: 'desc' },
    });

    sendSuccess(res, logs);
  } catch (error) {
    console.error('Get activity logs error:', error);
    sendError(res, 'Failed to fetch activity logs', 500);
  }
};

export const createActivityLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { activityId } = req.params;
    const { date, timeSpentMin, progress, outcome, nextStep, notes } = req.body;

    // Verify the activity belongs to the user
    const activity = await prisma.careerActivity.findFirst({
      where: { id: activityId, userId },
    });

    if (!activity) {
      sendError(res, 'Activity not found', 404);
      return;
    }

    const log = await prisma.careerActivityLog.create({
      data: {
        userId,
        activityId,
        date: date ? new Date(date) : new Date(),
        timeSpentMin,
        progress,
        outcome,
        nextStep,
        notes,
      },
    });

    // Note: We don't update the parent activity's timeSpentMin anymore.
    // The activity's total time is calculated dynamically from all its logs.
    // This ensures the daily log system shows time on the correct date.

    sendCreated(res, log, 'Activity log created successfully');
  } catch (error) {
    console.error('Create activity log error:', error);
    sendError(res, 'Failed to create activity log', 500);
  }
};

export const updateActivityLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { logId } = req.params;
    const { date, timeSpentMin, progress, outcome, nextStep, notes } = req.body;

    // Verify the log belongs to the user
    const existingLog = await prisma.careerActivityLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existingLog) {
      sendError(res, 'Log not found', 404);
      return;
    }

    // Note: We no longer update the parent activity's timeSpentMin.
    // Time is tracked per log date for accurate daily aggregation.

    const log = await prisma.careerActivityLog.update({
      where: { id: logId },
      data: {
        date: date ? new Date(date) : undefined,
        timeSpentMin,
        progress,
        outcome,
        nextStep,
        notes,
      },
    });

    sendSuccess(res, log);
  } catch (error) {
    console.error('Update activity log error:', error);
    sendError(res, 'Failed to update activity log', 500);
  }
};

export const deleteActivityLog = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { logId } = req.params;

    // Verify the log belongs to the user
    const existingLog = await prisma.careerActivityLog.findFirst({
      where: { id: logId, userId },
    });

    if (!existingLog) {
      sendError(res, 'Log not found', 404);
      return;
    }

    // Note: We no longer update the parent activity's timeSpentMin.
    // Time is tracked per log date for accurate daily aggregation.

    await prisma.careerActivityLog.delete({
      where: { id: logId },
    });

    sendSuccess(res, { message: 'Log deleted successfully' });
  } catch (error) {
    console.error('Delete activity log error:', error);
    sendError(res, 'Failed to delete activity log', 500);
  }
};

// Job Applications
const applicationCrud = createCrudController({
  model: 'jobApplication',
  include: {
    activities: {
      orderBy: { date: 'desc' },
      include: { logs: { orderBy: { date: 'desc' } } }
    }
  },
  orderBy: { createdAt: 'desc' },
  searchFields: ['company', 'roleTitle', 'notes'],
  dateField: 'appliedDate',
});

export const createJobApplication = applicationCrud.create;
export const getAllJobApplications = applicationCrud.getAll;
export const getJobApplicationById = applicationCrud.getOne;
export const updateJobApplication = applicationCrud.update;
export const deleteJobApplication = applicationCrud.delete;

// Get career statistics
export const getCareerStats = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { startDate, endDate } = req.query;

    const where: any = { userId };
    if (startDate || endDate) {
      where.date = {};
      if (startDate) where.date.gte = new Date(startDate as string);
      if (endDate) where.date.lte = new Date(endDate as string);
    }

    const [activities, applications] = await Promise.all([
      prisma.careerActivity.findMany({ where }),
      prisma.jobApplication.findMany({ where: { userId } }),
    ]);

    // Activities by type
    const byActivityType: Record<string, any> = {};
    activities.forEach((a) => {
      if (!byActivityType[a.activityType]) {
        byActivityType[a.activityType] = {
          count: 0,
          totalMinutes: 0,
        };
      }
      byActivityType[a.activityType].count++;
      byActivityType[a.activityType].totalMinutes += a.timeSpentMin || 0;
    });

    // Applications by status
    const applicationsByStatus: Record<string, number> = {};
    applications.forEach((a) => {
      applicationsByStatus[a.status] = (applicationsByStatus[a.status] || 0) + 1;
    });

    // Pipeline summary
    const pipelineStats = {
      total: applications.length,
      active: applications.filter((a) =>
        ['applied', 'screening', 'interview'].includes(a.status)
      ).length,
      offers: applications.filter((a) => a.status === 'offer').length,
      rejected: applications.filter((a) => a.status === 'rejected').length,
      successRate:
        applications.length > 0
          ? (applications.filter((a) => ['offer', 'accepted'].includes(a.status)).length /
              applications.length) *
            100
          : 0,
    };

    const stats = {
      activities: {
        total: activities.length,
        totalMinutes: activities.reduce((sum, a) => sum + (a.timeSpentMin || 0), 0),
        byType: byActivityType,
        averageCareerImpact: activities.filter((a) => a.careerImpact).length
          ? activities.reduce((sum, a) => sum + (a.careerImpact || 0), 0) /
            activities.filter((a) => a.careerImpact).length
          : null,
      },
      applications: {
        ...pipelineStats,
        byStatus: applicationsByStatus,
      },
    };

    sendSuccess(res, stats);
  } catch (error) {
    console.error('Get career stats error:', error);
    sendError(res, 'Failed to fetch career statistics', 500);
  }
};

// Get application pipeline
export const getApplicationPipeline = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;

    const applications = await prisma.jobApplication.findMany({
      where: { userId },
      orderBy: [{ status: 'asc' }, { appliedDate: 'desc' }],
    });

    // Group by status
    const pipeline: Record<string, typeof applications> = {
      draft: [],
      applied: [],
      screening: [],
      interview: [],
      offer: [],
      rejected: [],
      withdrawn: [],
      accepted: [],
    };

    applications.forEach((app) => {
      if (pipeline[app.status]) {
        pipeline[app.status].push(app);
      }
    });

    sendSuccess(res, pipeline);
  } catch (error) {
    console.error('Get application pipeline error:', error);
    sendError(res, 'Failed to fetch application pipeline', 500);
  }
};
