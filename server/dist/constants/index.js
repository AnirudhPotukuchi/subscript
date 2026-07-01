"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.HTTP_STATUS = exports.ALLOWED_EMAIL_DOMAINS = exports.REFRESH_SECRET = exports.JWT_SECRET = void 0;
exports.JWT_SECRET = process.env.JWT_SECRET || 'college-social-network-access-secret-1234';
exports.REFRESH_SECRET = process.env.REFRESH_SECRET || 'college-social-network-refresh-secret-5678';
exports.ALLOWED_EMAIL_DOMAINS = ['college.edu', 'student.college.edu', 'alumni.college.edu'];
exports.HTTP_STATUS = {
    OK: 200,
    CREATED: 201,
    BAD_REQUEST: 400,
    UNAUTHORIZED: 401,
    FORBIDDEN: 403,
    NOT_FOUND: 404,
    INTERNAL_SERVER_ERROR: 500
};
