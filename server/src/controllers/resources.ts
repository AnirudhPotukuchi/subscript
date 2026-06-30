import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { dbService } from '../services/db';
import { HTTP_STATUS } from '../constants';
import { ResourceDocument } from '../models/types';

export const getResources = async (req: AuthenticatedRequest, res: Response) => {
  const category = req.query.category as string;
  const semester = req.query.semester ? Number(req.query.semester) : undefined;
  const type = req.query.type as string;

  try {
    const list = await dbService.resources.findMany(
      (item) => {
        if (category && item.category !== category) return false;
        if (semester !== undefined && item.semester !== semester) return false;
        if (type && item.type !== type) return false;
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
      message: 'Failed to retrieve shared resources.'
    });
  }
};

export const createResource = async (req: AuthenticatedRequest, res: Response) => {
  const uid = req.user?.uid;
  if (!uid) return res.status(HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized.' });

  const { title, description, type, url, files, category, semester, tags } = req.body;

  if (!title || !description || !type || !category) {
    return res.status(HTTP_STATUS.BAD_REQUEST).json({
      success: false,
      message: 'Title, description, type, and category are required.'
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

    const newResource: Omit<ResourceDocument, 'id' | 'createdAt' | 'updatedAt'> = {
      authorId: uid,
      authorName: user.fullName,
      title: title.trim(),
      description: description.trim(),
      type,
      url: url || '',
      files: Array.isArray(files) ? files : [],
      category,
      semester: semester ? Number(semester) : undefined,
      tags: Array.isArray(tags) ? tags.map((t: string) => t.trim().toLowerCase()) : [],
      downloadsCount: 0
    };

    const saved = await dbService.resources.add(newResource);
    return res.status(HTTP_STATUS.CREATED).json({
      success: true,
      message: 'Resource shared successfully.',
      data: saved
    });

  } catch (error) {
    console.error('Create resource error:', error);
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to share resource.'
    });
  }
};

export const incrementDownload = async (req: AuthenticatedRequest, res: Response) => {
  const { id } = req.params;

  try {
    const resource = await dbService.resources.get(id);
    if (!resource) {
      return res.status(HTTP_STATUS.NOT_FOUND).json({
        success: false,
        message: 'Resource not found.'
      });
    }

    const updated = await dbService.resources.update(id, {
      downloadsCount: (resource.downloadsCount || 0) + 1
    });

    return res.status(HTTP_STATUS.OK).json({
      success: true,
      data: updated
    });
  } catch (error) {
    return res.status(HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: 'Failed to increment download counter.'
    });
  }
};
