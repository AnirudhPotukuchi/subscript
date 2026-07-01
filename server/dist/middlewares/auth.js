"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.hasRole = exports.isAuthenticated = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const constants_1 = require("../constants");
const isAuthenticated = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Access denied. No token provided.'
        });
    }
    const token = authHeader.split(' ')[1];
    try {
        const decoded = jsonwebtoken_1.default.verify(token, constants_1.JWT_SECRET);
        req.user = decoded;
        next();
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid or expired access token.'
        });
    }
};
exports.isAuthenticated = isAuthenticated;
const hasRole = (allowedRoles) => {
    return (req, res, next) => {
        if (!req.user) {
            return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'Authentication required.'
            });
        }
        if (!allowedRoles.includes(req.user.role)) {
            return res.status(constants_1.HTTP_STATUS.FORBIDDEN).json({
                success: false,
                message: 'Forbidden. You do not have permission to access this resource.'
            });
        }
        next();
    };
};
exports.hasRole = hasRole;
