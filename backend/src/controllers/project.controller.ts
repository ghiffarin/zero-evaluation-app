import { Request, Response } from 'express';
import prisma from '../utils/prisma.js';
import { sendSuccess, sendError, sendNotFound } from '../utils/response.js';
import { createCrudController } from '../services/crud.service.js';

const crud = createCrudController({
  model: 'project',
  include: {
    goals: true,
    _count: {
      select: {
        skillSessions: true,
        careerActivities: true,
      },
    },
  },
  orderBy: { updatedAt: 'desc' },
  searchFields: ['name', 'description'],
  dateField: 'createdAt',
});

export const createProject = crud.create;
export const getAllProjects = crud.getAll;
export const getProjectById = crud.getOne;
export const updateProject = crud.update;
export const deleteProject = crud.delete;

// Get project with all related activities
export const getProjectWithActivities = async (req: Request, res: Response): Promise<void> => {
  try {
    const userId = req.user!.id;
    const { id } = req.params;

    const project = await prisma.project.findFirst({
      where: { id, userId },
      include: {
        goals: true,
        skillSessions: {
          orderBy: { date: 'desc' },
          take: 10,
        },
        careerActivities: {
          orderBy: { date: 'desc' },
          take: 10,
        },
      },
    });

    if (!project) {
      sendNotFound(res, 'Project not found');
      return;
    }

    // Calculate project stats
    const totalSkillMinutes = project.skillSessions.reduce(
      (sum, s) => sum + (s.timeSpentMin || 0),
      0
    );
    const totalCareerMinutes = project.careerActivities.reduce(
      (sum, a) => sum + (a.timeSpentMin || 0),
      0
    );

    sendSuccess(res, {
      ...project,
      stats: {
        totalSkillSessions: project.skillSessions.length,
        totalCareerActivities: project.careerActivities.length,
        totalSkillMinutes,
        totalCareerMinutes,
        totalMinutes: totalSkillMinutes + totalCareerMinutes,
        goalsCount: project.goals.length,
        goalsAchieved: project.goals.filter((g) => g.status === 'achieved').length,
      },
    });
  } catch (error) {
    console.error('Get project with activities error:', error);
    sendError(res, 'Failed to fetch project', 500);
  }
};
