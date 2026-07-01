"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const api_1 = __importDefault(require("./routes/api"));
const constants_1 = require("./constants");
dotenv_1.default.config();
const app = (0, express_1.default)();
// Standard Middlewares
app.use((0, cors_1.default)({
    origin: true, // Allow client connection dynamically
    credentials: true
}));
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: true }));
// Health Check
app.get('/health', (req, res) => {
    res.status(constants_1.HTTP_STATUS.OK).json({ status: 'UP', message: 'College Network API is operational.' });
});
// Load Router
app.use('/api/v1', api_1.default);
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
        success: false,
        message: err.message || 'An internal server error occurred.'
    });
});
exports.default = app;
