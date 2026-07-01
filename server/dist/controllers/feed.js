"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.addComment = exports.getComments = exports.bookmarkPost = exports.likePost = exports.deletePost = exports.editPost = exports.createPost = exports.getFeed = void 0;
const db_1 = require("../services/db");
const moderation_1 = require("../services/moderation");
const constants_1 = require("../constants");
const getFeed = async (req, res) => {
    const limit = req.query.limit ? Number(req.query.limit) : 10;
    const tag = req.query.tag;
    try {
        // Only fetch approved posts (or pending review but let's keep them visible with warn, standard is approved)
        const posts = await db_1.dbService.posts.findMany((p) => {
            const isApproved = p.moderationStatus === 'approved' || p.moderationStatus === 'pending_review';
            if (tag) {
                return isApproved && p.tags.includes(tag.toLowerCase());
            }
            return isApproved;
        }, limit, 'createdAt', true);
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            data: posts
        });
    }
    catch (error) {
        console.error('Get feed error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve feed posts.'
        });
    }
};
exports.getFeed = getFeed;
const createPost = async (req, res) => {
    const uid = req.user?.uid;
    const email = req.user?.email;
    if (!uid || !email) {
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Unauthorized.'
        });
    }
    const { content, images, pdfs, codeSnippets, tags } = req.body;
    if (!content) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Post content cannot be empty.'
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
        // AI content moderation check
        const modResult = await (0, moderation_1.moderateContent)(content + ' ' + (tags ? tags.join(' ') : ''));
        const parsedTags = Array.isArray(tags)
            ? tags.map((t) => t.trim().toLowerCase().replace('#', ''))
            : [];
        const newPost = {
            authorId: uid,
            authorName: user.fullName,
            authorPicture: user.profilePicture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.fullName)}`,
            content,
            images: Array.isArray(images) ? images : [],
            pdfs: Array.isArray(pdfs) ? pdfs : [],
            codeSnippets: Array.isArray(codeSnippets) ? codeSnippets : [],
            likesCount: 0,
            likes: [],
            commentsCount: 0,
            tags: parsedTags,
            moderationStatus: modResult.status,
            toxicityScore: modResult.toxicityScore
        };
        const savedPost = await db_1.dbService.posts.add(newPost);
        // Audit logs if flagged
        if (modResult.status !== 'approved') {
            await db_1.dbService.auditLogs.add({
                action: 'flagged_content',
                targetId: savedPost.id,
                targetType: 'Post',
                performedBy: 'system',
                reason: `AI flagged post with toxicity score: ${modResult.toxicityScore}. Reasons: ${modResult.reasons.join(', ')}`
            });
        }
        return res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: modResult.status === 'flagged_hidden'
                ? 'Post submitted but flagged by automated moderation system for review.'
                : 'Post published successfully.',
            data: savedPost,
            moderation: {
                status: modResult.status,
                reasons: modResult.reasons
            }
        });
    }
    catch (error) {
        console.error('Create post error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create post.'
        });
    }
};
exports.createPost = createPost;
const editPost = async (req, res) => {
    const uid = req.user?.uid;
    const { id } = req.params;
    const { content, tags } = req.body;
    try {
        const post = await db_1.dbService.posts.get(id);
        if (!post) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Post not found.'
            });
        }
        if (post.authorId !== uid && req.user?.role !== 'admin') {
            return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'You are not authorized to edit this post.'
            });
        }
        // Run moderation on edit
        const modResult = await (0, moderation_1.moderateContent)(content || post.content);
        const parsedTags = Array.isArray(tags)
            ? tags.map((t) => t.trim().toLowerCase())
            : post.tags;
        const updated = await db_1.dbService.posts.update(id, {
            content: content || post.content,
            tags: parsedTags,
            moderationStatus: modResult.status,
            toxicityScore: modResult.toxicityScore
        });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Post updated successfully.',
            data: updated
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to update post.'
        });
    }
};
exports.editPost = editPost;
const deletePost = async (req, res) => {
    const uid = req.user?.uid;
    const { id } = req.params;
    try {
        const post = await db_1.dbService.posts.get(id);
        if (!post) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Post not found.'
            });
        }
        if (post.authorId !== uid && req.user?.role !== 'admin' && req.user?.role !== 'moderator') {
            return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Forbidden.'
            });
        }
        await db_1.dbService.posts.delete(id);
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Post deleted successfully.'
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to delete post.'
        });
    }
};
exports.deletePost = deletePost;
const likePost = async (req, res) => {
    const uid = req.user?.uid;
    const { id } = req.params;
    if (!uid)
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized.' });
    try {
        const post = await db_1.dbService.posts.get(id);
        const user = await db_1.dbService.users.get(uid);
        if (!post || !user) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Post or User not found.'
            });
        }
        const likedList = post.likes || [];
        const userLikedList = user.likedPosts || [];
        const isLiked = likedList.includes(uid);
        let updatedLikes;
        let updatedUserLikes;
        if (isLiked) {
            updatedLikes = likedList.filter((x) => x !== uid);
            updatedUserLikes = userLikedList.filter((x) => x !== id);
        }
        else {
            updatedLikes = [...likedList, uid];
            updatedUserLikes = [...userLikedList, id];
        }
        await db_1.dbService.posts.update(id, {
            likes: updatedLikes,
            likesCount: updatedLikes.length
        });
        await db_1.dbService.users.update(uid, {
            likedPosts: updatedUserLikes
        });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: isLiked ? 'Post unliked.' : 'Post liked.',
            data: {
                likesCount: updatedLikes.length,
                isLiked: !isLiked
            }
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to process like action.'
        });
    }
};
exports.likePost = likePost;
const bookmarkPost = async (req, res) => {
    const uid = req.user?.uid;
    const { id } = req.params;
    if (!uid)
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({ success: false, message: 'Unauthorized.' });
    try {
        const user = await db_1.dbService.users.get(uid);
        if (!user) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User profile not found.'
            });
        }
        const bookmarkList = user.bookmarks || [];
        const isBookmarked = bookmarkList.includes(id);
        let updatedBookmarks;
        if (isBookmarked) {
            updatedBookmarks = bookmarkList.filter((x) => x !== id);
        }
        else {
            updatedBookmarks = [...bookmarkList, id];
        }
        await db_1.dbService.users.update(uid, {
            bookmarks: updatedBookmarks
        });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: isBookmarked ? 'Bookmark removed.' : 'Bookmark saved.',
            data: {
                isBookmarked: !isBookmarked
            }
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to bookmark post.'
        });
    }
};
exports.bookmarkPost = bookmarkPost;
// COMMENT CONTROLLERS
const getComments = async (req, res) => {
    const { postId } = req.params;
    try {
        const comments = await db_1.dbService.comments.findMany((c) => c.postId === postId && c.moderationStatus === 'approved' && c.parentCommentId === null, 30, 'createdAt', false);
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            data: comments
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to load comments.'
        });
    }
};
exports.getComments = getComments;
const addComment = async (req, res) => {
    const uid = req.user?.uid;
    const { postId } = req.params;
    const { content, parentCommentId } = req.body;
    if (!uid || !content) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Comment content is required.'
        });
    }
    try {
        const user = await db_1.dbService.users.get(uid);
        const post = await db_1.dbService.posts.get(postId);
        if (!user || !post) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Post or User not found.'
            });
        }
        // Moderate comment
        const modResult = await (0, moderation_1.moderateContent)(content);
        const newComment = {
            authorId: uid,
            authorName: user.fullName,
            authorPicture: user.profilePicture || `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(user.fullName)}`,
            postId,
            content,
            likes: [],
            parentCommentId: parentCommentId || null,
            replies: [],
            moderationStatus: modResult.status
        };
        const savedComment = await db_1.dbService.comments.add(newComment);
        if (modResult.status === 'approved') {
            // If it's a sub-reply, add to parent replies array
            if (parentCommentId) {
                const parent = await db_1.dbService.comments.get(parentCommentId);
                if (parent) {
                    const parentReplies = parent.replies || [];
                    await db_1.dbService.comments.update(parentCommentId, {
                        replies: [...parentReplies, savedComment.id]
                    });
                }
            }
            // Increment comments count on original post
            await db_1.dbService.posts.update(postId, {
                commentsCount: (post.commentsCount || 0) + 1
            });
        }
        return res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: modResult.status === 'flagged_hidden'
                ? 'Comment flagged by moderation review.'
                : 'Comment posted.',
            data: savedComment
        });
    }
    catch (error) {
        console.error('Comment creation error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to create comment.'
        });
    }
};
exports.addComment = addComment;
