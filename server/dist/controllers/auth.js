"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.resetPassword = exports.forgotPassword = exports.verifyEmail = exports.refreshToken = exports.login = exports.signup = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const db_1 = require("../services/db");
const crypto_1 = require("../utils/crypto");
const constants_1 = require("../constants");
const signup = async (req, res) => {
    const { email, password, fullName, rollNumber, branch, year, section } = req.body;
    if (!email || !password || !fullName || !rollNumber || !branch || !year || !section) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'All registration fields are required.'
        });
    }
    // Validate college email domain
    const emailDomain = email.split('@')[1];
    if (!constants_1.ALLOWED_EMAIL_DOMAINS.includes(emailDomain)) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: `Invalid email. Access restricted to domains: ${constants_1.ALLOWED_EMAIL_DOMAINS.join(', ')}`
        });
    }
    try {
        // Check if email already exists
        const existingUser = await db_1.dbService.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase());
        if (existingUser) {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'A user with this email address already exists.'
            });
        }
        // Check if roll number already exists
        const existingRoll = await db_1.dbService.users.findOne((u) => u.rollNumber.toLowerCase() === rollNumber.toLowerCase());
        if (existingRoll) {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'A student with this roll number is already registered.'
            });
        }
        const hashedPassword = (0, crypto_1.hashPassword)(password);
        const verificationToken = Math.random().toString(36).substring(2, 15);
        // Initial student structure
        const newStudent = {
            uid: '', // Assigned after database instantiation
            email: email.toLowerCase(),
            password: hashedPassword, // Stored securely
            fullName,
            rollNumber: rollNumber.toUpperCase(),
            branch,
            year: Number(year),
            section,
            bio: '',
            profilePicture: `https://api.dicebear.com/7.x/adventurer/svg?seed=${encodeURIComponent(fullName)}`,
            skills: [],
            programmingLanguages: [],
            techStack: [],
            projects: [],
            achievements: [],
            hackathons: [],
            leetcodeUrl: '',
            codeforcesUrl: '',
            githubUrl: '',
            linkedinUrl: '',
            resumeUrl: '',
            placementStatus: 'unplaced',
            currentCompany: '',
            internships: [],
            followersCount: 0,
            followingCount: 0,
            followers: [],
            following: [],
            bookmarks: [],
            likedPosts: [],
            role: 'student',
            isVerified: false
        };
        // Store in database
        const savedUser = await db_1.dbService.users.add(newStudent);
        // Assign UID matching document generated ID
        await db_1.dbService.users.update(savedUser.id, {
            uid: savedUser.id,
            verificationToken: verificationToken
        });
        console.log(`✉️ Email verification mock token for ${email}: ${verificationToken}`);
        return res.status(constants_1.HTTP_STATUS.CREATED).json({
            success: true,
            message: 'Signup successful. Please verify your email using the link sent to your inbox.',
            data: {
                uid: savedUser.id,
                email: savedUser.email
            }
        });
    }
    catch (error) {
        console.error('Signup error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An error occurred during student registration.'
        });
    }
};
exports.signup = signup;
const login = async (req, res) => {
    const { email, password } = req.body;
    if (!email || !password) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Email and password are required.'
        });
    }
    try {
        const user = await db_1.dbService.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid credentials.'
            });
        }
        // Since we store password in user document for local mock login (in a real system, we'd use Firebase Auth,
        // but we support mock database password check seamlessly).
        // Let's store password securely. Wait, we need to extract password. We saved it in database or we'll allow password check.
        // Wait! Let's check how password is saved in `savedUser`.
        // In our `newStudent` structure, we should save `password` hash or we can attach password to the document.
        // Let's check: in `UserDocument` we can store `password`. Wait, let's look at `newStudent`. We didn't define a `password` field in `UserDocument` interface to avoid exposing password. But for authentication, we can store it in the database document safely under `password`.
        // Let's write `password: hashedPassword` when adding. Yes, let's update user record to hold the password.
        // Wait, is password in `UserDocument` model types? No, but Firestore documents can contain arbitrary keys.
        // Let's check how password verify is handled. In the signup code above, I didn't include `password: hashedPassword` in `newStudent`. Let's fix that by ensuring we store the password when creating!
        // Let's do `const dbUser = { ...newStudent, password: hashedPassword }`. That is perfect!
        // Let's read `password` from the user object dynamically as `(user as any).password`.
        const storedHash = user.password;
        if (!storedHash || !(0, crypto_1.verifyPassword)(password, storedHash)) {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid email or password.'
            });
        }
        // Generate tokens
        const accessToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, constants_1.JWT_SECRET, { expiresIn: '15m' });
        const refreshToken = jsonwebtoken_1.default.sign({ uid: user.uid }, constants_1.REFRESH_SECRET, { expiresIn: '7d' });
        // Secure cookie for web app
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
        });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Login successful.',
            data: {
                accessToken,
                refreshToken, // Returned in body for easier non-cookie client handling if needed
                user: {
                    uid: user.uid,
                    email: user.email,
                    fullName: user.fullName,
                    role: user.role,
                    profilePicture: user.profilePicture,
                    isVerified: user.isVerified
                }
            }
        });
    }
    catch (error) {
        console.error('Login error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An error occurred during login.'
        });
    }
};
exports.login = login;
const refreshToken = async (req, res) => {
    const token = req.body.refreshToken || req.cookies?.refreshToken;
    if (!token) {
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Refresh token is required.'
        });
    }
    try {
        const decoded = jsonwebtoken_1.default.verify(token, constants_1.REFRESH_SECRET);
        const user = await db_1.dbService.users.get(decoded.uid);
        if (!user) {
            return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
                success: false,
                message: 'User does not exist.'
            });
        }
        const newAccessToken = jsonwebtoken_1.default.sign({ uid: user.uid, email: user.email, role: user.role }, constants_1.JWT_SECRET, { expiresIn: '15m' });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            data: {
                accessToken: newAccessToken
            }
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Invalid or expired refresh token.'
        });
    }
};
exports.refreshToken = refreshToken;
const verifyEmail = async (req, res) => {
    const { token, uid } = req.body;
    if (!token || !uid) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Token and UID are required.'
        });
    }
    try {
        const user = await db_1.dbService.users.get(uid);
        if (!user) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found.'
            });
        }
        const userToken = user.verificationToken;
        if (userToken === token) {
            await db_1.dbService.users.update(uid, {
                isVerified: true,
                verificationToken: null
            });
            return res.status(constants_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'Email address verified successfully.'
            });
        }
        else {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid email verification token.'
            });
        }
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Email verification failed.'
        });
    }
};
exports.verifyEmail = verifyEmail;
const forgotPassword = async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Email is required.'
        });
    }
    try {
        const user = await db_1.dbService.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            // Avoid revealing that user doesn't exist for security reasons, return successful message anyway
            return res.status(constants_1.HTTP_STATUS.OK).json({
                success: true,
                message: 'If the email matches a registered student, a password reset link has been sent.'
            });
        }
        const resetToken = Math.random().toString(36).substring(2, 15);
        const expires = new Date();
        expires.setHours(expires.getHours() + 1); // 1 hour expiration
        await db_1.dbService.users.update(user.uid, {
            resetPasswordToken: resetToken,
            resetPasswordExpires: expires
        });
        console.log(`✉️ Password reset mock token for ${email}: ${resetToken}`);
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'If the email matches a registered student, a password reset link has been sent.'
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Password reset trigger failed.'
        });
    }
};
exports.forgotPassword = forgotPassword;
const resetPassword = async (req, res) => {
    const { token, email, newPassword } = req.body;
    if (!token || !email || !newPassword) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'Token, email, and new password are required.'
        });
    }
    try {
        const user = await db_1.dbService.users.findOne((u) => u.email.toLowerCase() === email.toLowerCase());
        if (!user) {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid email or token.'
            });
        }
        const savedToken = user.resetPasswordToken;
        const expiresStr = user.resetPasswordExpires;
        if (!savedToken || savedToken !== token) {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Invalid password reset token.'
            });
        }
        if (expiresStr && new Date(expiresStr) < new Date()) {
            return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
                success: false,
                message: 'Password reset token has expired.'
            });
        }
        const hashedPassword = (0, crypto_1.hashPassword)(newPassword);
        await db_1.dbService.users.update(user.uid, {
            password: hashedPassword,
            resetPasswordToken: null,
            resetPasswordExpires: null
        });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Password reset successfully. You can now login with your new password.'
        });
    }
    catch (error) {
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to reset password.'
        });
    }
};
exports.resetPassword = resetPassword;
