"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = __importDefault(require("./auth"));
const users_1 = require("../controllers/users");
const feed_1 = require("../controllers/feed");
const interviews_1 = require("../controllers/interviews");
const resources_1 = require("../controllers/resources");
const search_1 = require("../controllers/search");
const admin_1 = require("../controllers/admin");
const auth_2 = require("../middlewares/auth");
const apiRouter = (0, express_1.Router)();
// Guest Auth Routes
apiRouter.use('/auth', auth_1.default);
// Profile Routes (Protected)
apiRouter.get('/users/profile/:id', auth_2.isAuthenticated, users_1.getProfile);
apiRouter.put('/users/profile', auth_2.isAuthenticated, users_1.updateProfile);
apiRouter.post('/users/:id/follow', auth_2.isAuthenticated, users_1.followUser);
// Post & Feed Routes (Protected)
apiRouter.get('/feed', auth_2.isAuthenticated, feed_1.getFeed);
apiRouter.post('/feed/posts', auth_2.isAuthenticated, feed_1.createPost);
apiRouter.put('/feed/posts/:id', auth_2.isAuthenticated, feed_1.editPost);
apiRouter.delete('/feed/posts/:id', auth_2.isAuthenticated, feed_1.deletePost);
apiRouter.post('/feed/posts/:id/like', auth_2.isAuthenticated, feed_1.likePost);
apiRouter.post('/feed/posts/:id/bookmark', auth_2.isAuthenticated, feed_1.bookmarkPost);
// Comments (Protected)
apiRouter.get('/feed/posts/:postId/comments', auth_2.isAuthenticated, feed_1.getComments);
apiRouter.post('/feed/posts/:postId/comments', auth_2.isAuthenticated, feed_1.addComment);
// Interview Experiences (Protected)
apiRouter.get('/interviews', auth_2.isAuthenticated, interviews_1.getInterviews);
apiRouter.post('/interviews', auth_2.isAuthenticated, interviews_1.createInterview);
apiRouter.post('/interviews/:id/vote', auth_2.isAuthenticated, interviews_1.upvoteInterview);
// Resources Sharing (Protected)
apiRouter.get('/resources', auth_2.isAuthenticated, resources_1.getResources);
apiRouter.post('/resources', auth_2.isAuthenticated, resources_1.createResource);
apiRouter.post('/resources/:id/download', auth_2.isAuthenticated, resources_1.incrementDownload);
// Global Search (Protected)
apiRouter.get('/search', auth_2.isAuthenticated, search_1.globalSearch);
// Admin & Moderation Dashboard (Protected + Admin/Moderator Checks)
apiRouter.get('/admin/moderation-queue', auth_2.isAuthenticated, (0, auth_2.hasRole)(['admin', 'moderator']), admin_1.getModerationQueue);
apiRouter.post('/admin/moderation/:id/resolve', auth_2.isAuthenticated, (0, auth_2.hasRole)(['admin', 'moderator']), admin_1.resolveModeration);
apiRouter.get('/admin/metrics', auth_2.isAuthenticated, (0, auth_2.hasRole)(['admin', 'moderator']), admin_1.getMetrics);
exports.default = apiRouter;
