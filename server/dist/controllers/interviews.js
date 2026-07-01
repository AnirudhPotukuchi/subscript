"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.upvoteInterview = exports.createInterview = exports.getInterviews = void 0;
const db_1 = require("../services/db");
const constants_1 = require("../constants");
const getInterviews = async (req, res) => {
    const company = req.query.company;
    const role = req.query.role;
    const difficulty = req.query.difficulty;
    try {
        const list = await db_1.dbService.interviews.findMany((item) => {
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
        }, 30, 'createdAt', true);
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            data: list
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve interview experiences.'
        });
    }
};
exports.getInterviews = getInterviews;
const createInterview = async (req, res) => {
    const uid = req.user?.uid;
    if (!uid)
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized.' });
    const { company, role, packageDetails, type, mode, interviewRounds, codingQuestions, systemDesignQuestions, hrQuestions, behavioralQuestions, difficulty, preparationTips, resources, outcome, tags } = req.body;
    if (!company || !role || !type || !mode || !outcome) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Company, role, package, type, mode, and outcome are required fields.'
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
        const newExp = {
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
            tags: Array.isArray(tags) ? tags.map((t) => t.trim().toLowerCase()) : [],
            votes: [],
            commentsCount: 0
        };
        const saved = await db_1.dbService.interviews.add(newExp);
        return res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Interview experience shared successfully.',
            data: saved
        });
    }
    catch (error) {
        console.error('Create interview error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to save interview experience.'
        });
    }
};
exports.createInterview = createInterview;
const upvoteInterview = async (req, res) => {
    const uid = req.user?.uid;
    const { id } = req.params;
    if (!uid)
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized.' });
    try {
        const exp = await db_1.dbService.interviews.get(id);
        if (!exp) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Interview experience post not found.'
            });
        }
        const votesList = exp.votes || [];
        const hasVoted = votesList.includes(uid);
        let updatedVotes;
        if (hasVoted) {
            updatedVotes = votesList.filter((x) => x !== uid);
        }
        else {
            updatedVotes = [...votesList, uid];
        }
        await db_1.dbService.interviews.update(id, {
            votes: updatedVotes
        });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: hasVoted ? 'Upvote removed.' : 'Upvoted experience post.',
            data: {
                upvotesCount: updatedVotes.length,
                hasVoted: !hasVoted
            }
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to upvote.'
        });
    }
};
exports.upvoteInterview = upvoteInterview;
