"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.followUser = exports.updateProfile = exports.getProfile = void 0;
const db_1 = require("../services/db");
const constants_1 = require("../constants");
const getProfile = async (req, res) => {
    const { id } = req.params;
    try {
        const user = await db_1.dbService.users.get(id);
        if (!user) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'Profile not found.'
            });
        }
        // Exclude password and verification tokens from response
        const { password, verificationToken, resetPasswordToken, resetPasswordExpires, ...safeProfile } = user;
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            data: safeProfile
        });
    }
    catch (error) {
        console.error('Get profile error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Failed to retrieve profile.'
        });
    }
};
exports.getProfile = getProfile;
const updateProfile = async (req, res) => {
    const uid = req.user?.uid;
    if (!uid) {
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Unauthorized.'
        });
    }
    // Permissible fields to update
    const { fullName, bio, profilePicture, skills, programmingLanguages, techStack, projects, achievements, hackathons, leetcodeUrl, codeforcesUrl, githubUrl, linkedinUrl, resumeUrl, placementStatus, currentCompany, internships, year, section } = req.body;
    try {
        const existing = await db_1.dbService.users.get(uid);
        if (!existing) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User profile not found.'
            });
        }
        const updatedProfile = await db_1.dbService.users.update(uid, {
            fullName: fullName || existing.fullName,
            bio: bio !== undefined ? bio : existing.bio,
            profilePicture: profilePicture !== undefined ? profilePicture : existing.profilePicture,
            skills: Array.isArray(skills) ? skills : existing.skills,
            programmingLanguages: Array.isArray(programmingLanguages) ? programmingLanguages : existing.programmingLanguages,
            techStack: Array.isArray(techStack) ? techStack : existing.techStack,
            projects: Array.isArray(projects) ? projects : existing.projects,
            achievements: Array.isArray(achievements) ? achievements : existing.achievements,
            hackathons: Array.isArray(hackathons) ? hackathons : existing.hackathons,
            leetcodeUrl: leetcodeUrl !== undefined ? leetcodeUrl : existing.leetcodeUrl,
            codeforcesUrl: codeforcesUrl !== undefined ? codeforcesUrl : existing.codeforcesUrl,
            githubUrl: githubUrl !== undefined ? githubUrl : existing.githubUrl,
            linkedinUrl: linkedinUrl !== undefined ? linkedinUrl : existing.linkedinUrl,
            resumeUrl: resumeUrl !== undefined ? resumeUrl : existing.resumeUrl,
            placementStatus: placementStatus || existing.placementStatus,
            currentCompany: currentCompany !== undefined ? currentCompany : existing.currentCompany,
            internships: Array.isArray(internships) ? internships : existing.internships,
            year: year !== undefined ? Number(year) : existing.year,
            section: section || existing.section
        });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: 'Profile updated successfully.',
            data: updatedProfile
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An error occurred while updating your profile.'
        });
    }
};
exports.updateProfile = updateProfile;
const followUser = async (req, res) => {
    const currentUid = req.user?.uid;
    const targetUid = req.params.id;
    if (!currentUid) {
        return res.status(constants_1.HTTP_STATUS.UNAUTHORIZED).json({
            success: false,
            message: 'Unauthorized.'
        });
    }
    if (currentUid === targetUid) {
        return res.status(constants_1.HTTP_STATUS.BAD_REQUEST).json({
            success: false,
            message: 'You cannot follow yourself.'
        });
    }
    try {
        const currentUser = await db_1.dbService.users.get(currentUid);
        const targetUser = await db_1.dbService.users.get(targetUid);
        if (!currentUser || !targetUser) {
            return res.status(constants_1.HTTP_STATUS.NOT_FOUND).json({
                success: false,
                message: 'User not found.'
            });
        }
        const followingList = currentUser.following || [];
        const followersList = targetUser.followers || [];
        const isFollowing = followingList.includes(targetUid);
        let updatedFollowing;
        let updatedFollowers;
        if (isFollowing) {
            // Unfollow
            updatedFollowing = followingList.filter((uid) => uid !== targetUid);
            updatedFollowers = followersList.filter((uid) => uid !== currentUid);
        }
        else {
            // Follow
            updatedFollowing = [...followingList, targetUid];
            updatedFollowers = [...followersList, currentUid];
        }
        await db_1.dbService.users.update(currentUid, {
            following: updatedFollowing,
            followingCount: updatedFollowing.length
        });
        await db_1.dbService.users.update(targetUid, {
            followers: updatedFollowers,
            followersCount: updatedFollowers.length
        });
        return res.status(constants_1.HTTP_STATUS.OK).json({
            success: true,
            message: isFollowing ? 'Unfollowed user successfully.' : 'Followed user successfully.',
            data: {
                isFollowing: !isFollowing,
                followersCount: updatedFollowers.length
            }
        });
    }
    catch (error) {
        console.error('Follow error:', error);
        return res.status(constants_1.HTTP_STATUS.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'An error occurred during the follow action.'
        });
    }
};
exports.followUser = followUser;
