"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const app_1 = __importDefault(require("./app"));
const PORT = process.env.PORT || 5000;
app_1.default.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`🎓 College Social Network Backend Server        `);
    console.log(`🚀 Live on: http://localhost:${PORT}             `);
    console.log(`📡 Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`===============================================`);
});
