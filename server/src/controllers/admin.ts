import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { dbService } from '../services/db';
import { HTTP_STATUS } from '../constants';

export const getModerationQueue = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const flaggedPosts = await dbService.posts.findMany(
      (p) => p.moderationStatus === 'flagged_hidden' || p.moderationStatus === 'pending_review'
    );
    
    // We can fetch comments under moderation too
    const flaggedComments = await dbService.comments.findMany(
      (c) => c.moderationStatus === 'flagged_hidden' || c.moderationStatus === 'pending_review'
    );

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        posts: flaggedPosts,
        comments: flaggedComments
      }
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to fetch moderation queue.'
    });
  }
};

export const resolveModeration = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;
  const { action, targetType, reason } = req.body; // action: 'approve' | 'flag'

  if (!action || !targetType || !reason) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Action, targetType, and reason are required.'
    });
  }

  try {
    const adminUid = req.user?.uid || 'system';
    const statusValue = action === 'approve' ? 'approved' : 'flagged_hidden';

    if (targetType === 'Post') {
      const post = await dbService.posts.get(id);
      if (!post) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Post not found.' });
      
      await dbService.posts.update(id, { moderationStatus: statusValue });
    } else if (targetType === 'Comment') {
      const comment = await dbService.comments.get(id);
      if (!comment) return res.status(HTTP_STATUS.NOT_FOUND).json({ success: false, message: 'Comment not found.' });

      await dbService.comments.update(id, { moderationStatus: statusValue });
    } else {
      return res.status(HTTP_STATUS.BAD_REQUEST).json({
        success: false,
        message: 'Invalid targetType.'
      });
    }

    // Add Audit Log
    const log = await dbService.auditLogs.add({
      action: action === 'approve' ? 'override_approve' : 'flagged_content',
      targetId: id as any,
      targetType,
      performedBy: adminUid,
      reason
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      message: `Content resolved successfully as ${statusValue}.`,
      auditLog: log
    });

  } catch (error) {
    console.error('Resolve moderation error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to resolve moderated item.'
    });
  }
};

export const getMetrics = async (req: AuthenticatedRequest, res: Response) => {
  try {
    const allUsers = await dbService.users.findMany();
    const allPosts = await dbService.posts.findMany();
    const allInterviews = await dbService.interviews.findMany();
    const allResources = await dbService.resources.findMany();

    const userCount = allUsers.length;
    const postCount = allPosts.length;
    const interviewCount = allInterviews.length;
    const resourceCount = allResources.length;

    // Placed vs Unplaced Metrics
    const placedCount = allUsers.filter((u) => u.placementStatus === 'placed').length;
    const internCount = allUsers.filter((u) => u.placementStatus === 'internship').length;
    const unplacedCount = allUsers.filter((u) => u.placementStatus === 'unplaced').length;

    // Department Analytics
    const branchCounts: Record<string, number> = {};
    allUsers.forEach((u) => {
      const branch = u.branch || 'Unknown';
      branchCounts[branch] = (branchCounts[branch] || 0) + 1;
    });

    // Popular Tags (Aggregation)
    const tagFrequencies: Record<string, number> = {};
    allPosts.forEach((p) => {
      (p.tags || []).forEach((t) => {
        tagFrequencies[t] = (tagFrequencies[t] || 0) + 1;
      });
    });
    const popularTags = Object.entries(tagFrequencies)
      .map(([name, count]) => ({ name, count }))
      .sort((a, b) => b.count - a.count)
      .slice(0, 5);

    // Active Users (mock calculations for demonstration using created dates)
    const dailyActive = Math.round(userCount * 0.45 + 2); // 45% simulation
    const weeklyActive = Math.round(userCount * 0.75 + 4);
    const monthlyActive = Math.round(userCount * 0.9 + 5);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        activeUsers: {
          daily: dailyActive,
          weekly: weeklyActive,
          monthly: monthlyActive
        },
        counts: {
          users: userCount,
          posts: postCount,
          interviews: interviewCount,
          resources: resourceCount
        },
        placementStats: {
          placed: placedCount,
          internship: internCount,
          unplaced: unplacedCount
        },
        branchStats: branchCounts,
        popularTags
      }
    });

  } catch (error) {
    console.error('Metrics extraction error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to retrieve application analytics.'
    });
  }
};
