"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.globalSearch = void 0;
const db_1 = require("../services/db");
const constants_1 = require("../constants");
const globalSearch = async (req, res) => {
    const query = (req.query.q || '').trim().toLowerCase();
    if (!query) {
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            data: { students: [], posts: [], resources: [], interviews: [] }
        });
    }
    try {
        // 1. Search Students
        const students = await db_1.dbService.users.findMany((u) => {
            return (u.fullName.toLowerCase().includes(query) ||
                u.rollNumber.toLowerCase().includes(query) ||
                u.skills.some((s) => s.toLowerCase().includes(query)) ||
                u.techStack.some((t) => t.toLowerCase().includes(query)));
        }, 15);
        // 2. Search Posts (only approved)
        const posts = await db_1.dbService.posts.findMany((p) => {
            return (p.moderationStatus === 'approved' &&
                (p.content.toLowerCase().includes(query) ||
                    p.tags.some((t) => t.toLowerCase().includes(query))));
        }, 15);
        // 3. Search Resources
        const resources = await db_1.dbService.resources.findMany((r) => {
            return (r.title.toLowerCase().includes(query) ||
                r.description.toLowerCase().includes(query) ||
                r.tags.some((t) => t.toLowerCase().includes(query)));
        }, 15);
        // 4. Search Interview Experiences
        const interviews = await db_1.dbService.interviews.findMany((i) => {
            return (i.company.toLowerCase().includes(query) ||
                i.role.toLowerCase().includes(query) ||
                i.tags.some((t) => t.toLowerCase().includes(query)));
        }, 15);
        return res.status(constants_1.HTTP_STATUS.OK).json({
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
    }
    catch (error) {
        console.error('Global search error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Search query execution failed.'
        });
    }
};
exports.globalSearch = globalSearch;
