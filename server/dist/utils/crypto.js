"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.verifyPassword = exports.hashPassword = void 0;
const crypto_1 = __importDefault(require("crypto"));
const hashPassword = (password) => {
    const salt = crypto_1.default.randomBytes(16).toString('hex');
    const hash = crypto_1.default.scryptSync(password, salt, 64).toString('hex');
    return `${salt}:${hash}`;
};
exports.hashPassword = hashPassword;
const verifyPassword = (password, storedValue) => {
    const [salt, originalHash] = storedValue.split(':');
    if (!salt || !originalHash)
        return false;
    const hash = crypto_1.default.scryptSync(password, salt, 64).toString('hex');
    return hash === originalHash;
};
exports.verifyPassword = verifyPassword;
