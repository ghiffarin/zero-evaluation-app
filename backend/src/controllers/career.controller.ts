import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

// Career Activities
const activityCrud = createCrudController({
  model: 'careerActivity',
  include: { project: true },
  orderBy: { date: 'desc' },
  searchFields: ['targetEntity', 'description', 'outputSummary'],
});

export const createCareerActivity = activityCrud.create;
export const getAllCareerActivities = activityCrud.getAll;
export const getCareerActivityById = activityCrud.getOne;
export const updateCareerActivity = activityCrud.update;
export const deleteCareerActivity = activityCrud.delete;

// Job Applications
const applicationCrud = createCrudController({
  model: 'jobApplication',
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
