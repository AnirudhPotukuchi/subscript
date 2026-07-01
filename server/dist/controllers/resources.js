"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.incrementDownload = exports.createResource = exports.getResources = void 0;
const db_1 = require("../services/db");
const constants_1 = require("../constants");
const getResources = async (req, res) => {
    const category = req.query.category;
    const semester = req.query.semester ? Number(req.query.semester) : undefined;
    const type = req.query.type;
    try {
        const list = await db_1.dbService.resources.findMany((item) => {
            if (category && item.category !== category)
                return false;
            if (semester !== undefined && item.semester !== semester)
                return false;
            if (type && item.type !== type)
                return false;
            return true;
        }, 30, 'createdAt', true);
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            data: list
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve shared resources.'
        });
    }
};
exports.getResources = getResources;
const createResource = async (req, res) => {
    const uid = req.user?.uid;
    if (!uid)
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized.' });
    const { title, description, type, url, files, category, semester, tags } = req.body;
    if (!title || !description || !type || !category) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Title, description, type, and category are required.'
        });
    }
    try {
        const user = await db_1.dbService.users.get(uid);
        if (!user) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User profile not found.'
            });
        }
        const newResource = {
            authorId: uid,
            authorName: user.fullName,
            title: title.trim(),
            description: description.trim(),
            type,
            url: url || '',
            files: Array.isArray(files) ? files : [],
            category,
            semester: semester ? Number(semester) : undefined,
            tags: Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()) : [],
            downloadsCount: 0
        };
        const saved = await db_1.dbService.resources.add(newResource);
        return res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Resource shared successfully.',
            data: saved
        });
    }
    catch (error) {
        console.error('Create resource error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to share resource.'
        });
    }
};
exports.createResource = createResource;
const incrementDownload = async (req, res) => {
    const { id } = req.params;
    try {
        const resource = await db_1.dbService.resources.get(id);
        if (!resource) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Resource not found.'
            });
        }
        const updated = await db_1.dbService.resources.update(id, {
            downloadsCount: (resource.downloadsCount || 0) + 1
        });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            data: updated
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to increment download counter.'
        });
    }
};
exports.incrementDownload = incrementDownload;
