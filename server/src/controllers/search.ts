import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { dbService } from '../services/db';
import { HTTP_STATUS } from '../constants';

export const globalSearch = async (req: AuthenticatedRequest, res: Response) => {
  const query = (req.query.q as string || '').trim().toLowerCase();

  if (!query) {
    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: { students: [], posts: [], resources: [], interviews: [] }
    });
  }

  try {
    // 1. Search Students
    const students = await dbService.users.findMany((u) => {
      return (
        u.fullName.toLowerCase().includes(query) ||
        u.rollNumber.toLowerCase().includes(query) ||
        u.skills.some((s) => s.toLowerCase().includes(query)) ||
        u.techStack.some((t) => t.toLowerCase().includes(query))
      );
    }, 15);

    // 2. Search Posts (only approved)
    const posts = await dbService.posts.findMany((p) => {
      return (
        p.moderationStatus === 'approved' &&
        (p.content.toLowerCase().includes(query) ||
          p.tags.some((t) => t.toLowerCase().includes(query)))
      );
    }, 15);

    // 3. Search Resources
    const resources = await dbService.resources.findMany((r) => {
      return (
        r.title.toLowerCase().includes(query) ||
        r.description.toLowerCase().includes(query) ||
        r.tags.some((t) => t.toLowerCase().includes(query))
      );
    }, 15);

    // 4. Search Interview Experiences
    const interviews = await dbService.interviews.findMany((i) => {
      return (
        i.company.toLowerCase().includes(query) ||
        i.role.toLowerCase().includes(query) ||
        i.tags.some((t) => t.toLowerCase().includes(query))
      );
    }, 15);

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: {
        students: students.map((u) => ({
          uid: u.uid,
          fullName: u.fullName,
          branch: u.branch,
          year: u.year,
          profilePicture: u.profilePicture,
          placementStatus: u.placementStatus
        })),
        posts,
        resources,
        interviews
      }
    });

  } catch (error) {
    console.error('Global search error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Search query execution failed.'
    });
  }
};
