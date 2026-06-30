import { Router } from 'express';
import authRouter from './auth';
import { getProfile, updateProfile, followUser } from '../controllers/users';
import { getFeed, createPost, editPost, deletePost, likePost, bookmarkPost, getComments, addComment } from '../controllers/feed';
import { getInterviews, createInterview, upvoteInterview } from '../controllers/interviews';
import { getResources, createResource, incrementDownload } from '../controllers/resources';
import { globalSearch } from '../controllers/search';
import { getModerationQueue, resolveModeration, getMetrics } from '../controllers/admin';
import { isAuthenticated, hasRole } from '../middlewares/auth';

const apiRouter = Router();

// Guest Auth Routes
apiRouter.use('/auth', authRouter);

// Profile Routes (Protected)
apiRouter.get('/users/profile/:id', isAuthenticated, getProfile);
apiRouter.put('/users/profile', isAuthenticated, updateProfile);
apiRouter.post('/users/:id/follow', isAuthenticated, followUser);

// Post & Feed Routes (Protected)
apiRouter.get('/feed', isAuthenticated, getFeed);
apiRouter.post('/feed/posts', isAuthenticated, createPost);
apiRouter.put('/feed/posts/:id', isAuthenticated, editPost);
apiRouter.delete('/feed/posts/:id', isAuthenticated, deletePost);
apiRouter.post('/feed/posts/:id/like', isAuthenticated, likePost);
apiRouter.post('/feed/posts/:id/bookmark', isAuthenticated, bookmarkPost);

// Comments (Protected)
apiRouter.get('/feed/posts/:postId/comments', isAuthenticated, getComments);
apiRouter.post('/feed/posts/:postId/comments', isAuthenticated, addComment);

// Interview Experiences (Protected)
apiRouter.get('/interviews', isAuthenticated, getInterviews);
apiRouter.post('/interviews', isAuthenticated, createInterview);
apiRouter.post('/interviews/:id/vote', isAuthenticated, upvoteInterview);

// Resources Sharing (Protected)
apiRouter.get('/resources', isAuthenticated, getResources);
apiRouter.post('/resources', isAuthenticated, createResource);
apiRouter.post('/resources/:id/download', isAuthenticated, incrementDownload);

// Global Search (Protected)
apiRouter.get('/search', isAuthenticated, globalSearch);

// Admin & Moderation Dashboard (Protected + Admin/Moderator Checks)
apiRouter.get('/admin/moderation-queue', isAuthenticated, hasRole(['admin', 'moderator']), getModerationQueue);
apiRouter.post('/admin/moderation/:id/resolve', isAuthenticated, hasRole(['admin', 'moderator']), resolveModeration);
apiRouter.get('/admin/metrics', isAuthenticated, hasRole(['admin', 'moderator']), getMetrics);

export default apiRouter;
