import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { dbService } from '../services/db';
import { HTTP_STATUS } from '../constants';
import { InterviewExperienceDocument } from '../models/types';

export const getInterviews = async (req: AuthenticatedRequest, res: Response) => {
  const company = req.query.company as string;
  const role = req.query.role as string;
  const difficulty = req.query.difficulty as string;

  try {
    const list = await dbService.interviews.findMany(
      (item) => {
        if (company && !item.company.toLowerCase().includes(company.toLowerCase())) {
          return false;
        }
        if (role && !item.role.toLowerCase().includes(role.toLowerCase())) {
          return false;
        }
        if (difficulty && item.difficulty !== difficulty) {
          return false;
        }
        return true;
      },
      30,
      'createdAt',
      true
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: list
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve interview experiences.'
    });
  }
};

export const createInterview = async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized.' });

  const {
    company,
    role,
    packageDetails,
    type,
    mode,
    interviewRounds,
    codingQuestions,
    systemDesignQuestions,
    hrQuestions,
    behavioralQuestions,
    difficulty,
    preparationTips,
    resources,
    outcome,
    tags
  } = req.body;

  if (!company || !role || !type || !mode || !outcome) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Company, role, package, type, mode, and outcome are required fields.'
    });
  }

  try {
    const user = await dbService.users.get(uid);
    if (!user) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    const newExp: Omit<InterviewExperienceDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      authorId: uid,
      authorName: user.fullName,
      company: company.trim(),
      role: role.trim(),
      packageDetails: packageDetails || '',
      type,
      mode,
      interviewRounds: Array.isArray(interviewRounds) ? interviewRounds : [],
      codingQuestions: Array.isArray(codingQuestions) ? codingQuestions : [],
      systemDesignQuestions: Array.isArray(systemDesignQuestions) ? systemDesignQuestions : [],
      hrQuestions: Array.isArray(hrQuestions) ? hrQuestions : [],
      behavioralQuestions: Array.isArray(behavioralQuestions) ? behavioralQuestions : [],
      difficulty: difficulty || 'medium',
      preparationTips: preparationTips || '',
      resources: Array.isArray(resources) ? resources : [],
      outcome,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim().toLowerCase()) : [],
      votes: [],
      commentsCount: 0
    };

    const saved = await dbService.interviews.add(newExp);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Interview experience shared successfully.',
      data: saved
    });
  } catch (error) {
    console.error('Create interview error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to save interview experience.'
    });
  }
};

export const upvoteInterview = async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  const { id } = req.params;

  if (!uid) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized.' });

  try {
    const exp = await dbService.interviews.get(id);
    if (!exp) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Interview experience post not found.'
      });
    }

    const votesList = exp.votes || [];
    const hasVoted = votesList.includes(uid);

    let updatedVotes: string[];
    if (hasVoted) {
      updatedVotes = votesList.filter((x) => x !== uid);
    } else {
      updatedVotes = [...votesList, uid];
    }

    await dbService.interviews.update(id, {
      votes: updatedVotes
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: hasVoted ? 'Upvote removed.' : 'Upvoted experience post.',
      data: {
        upvotesCount: updatedVotes.length,
        hasVoted: !hasVoted
      }
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to upvote.'
    });
  }
};
