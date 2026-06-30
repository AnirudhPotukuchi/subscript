export interface UserDocument {
  uid: string;
  email: string;
  fullName: string;
  rollNumber: string;
  branch: string;
  year: number;
  section: string;
  bio: string;
  profilePicture: string;
  skills: string[];
  programmingLanguages: string[];
  techStack: string[];
  projects: {
    title: string;
    description?: string;
    githubUrl?: string;
    liveUrl?: string;
  }[];
  achievements: string[];
  hackathons: string[];
  leetcodeUrl: string;
  codeforcesUrl: string;
  githubUrl: string;
  linkedinUrl: string;
  resumeUrl: string;
  placementStatus: 'unplaced' | 'placed' | 'internship';
  currentCompany: string;
  internships: {
    company: string;
    role: string;
    duration: string;
  }[];
  followersCount: number;
  followingCount: number;
  followers: string[];
  following: string[];
  bookmarks: string[];
  likedPosts: string[];
  role: 'student' | 'moderator' | 'admin';
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
  id?: string;
  password?: string;
  verificationToken?: string | null;
  resetPasswordToken?: string | null;
  resetPasswordExpires?: string | null;
}

export interface PostDocument {
  id?: string;
  authorId: string;
  authorName: string;
  authorPicture: string;
  content: string;
  images: string[];
  pdfs: string[];
  codeSnippets: {
    language: string;
    code: string;
  }[];
  likesCount: number;
  likes: string[];
  commentsCount: number;
  tags: string[];
  moderationStatus: 'pending_review' | 'approved' | 'flagged_hidden';
  toxicityScore: number;
  createdAt: string;
  updatedAt: string;
}

export interface CommentDocument {
  id?: string;
  authorId: string;
  authorName: string;
  authorPicture: string;
  postId: string;
  content: string;
  likes: string[];
  parentCommentId: string | null;
  replies: string[];
  moderationStatus: 'pending_review' | 'approved' | 'flagged_hidden';
  createdAt: string;
}

export interface InterviewExperienceDocument {
  id?: string;
  authorId: string;
  authorName: string;
  company: string;
  role: string;
  packageDetails: string;
  type: 'internship' | 'full-time';
  mode: 'online' | 'offline';
  interviewRounds: {
    roundName: string;
    details: string;
  }[];
  codingQuestions: string[];
  systemDesignQuestions: string[];
  hrQuestions: string[];
  behavioralQuestions: string[];
  difficulty: 'easy' | 'medium' | 'hard';
  preparationTips: string;
  resources: string[];
  outcome: 'selected' | 'rejected' | 'pending';
  tags: string[];
  votes: string[];
  commentsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface ResourceDocument {
  id?: string;
  authorId: string;
  authorName: string;
  title: string;
  description: string;
  type: 'notes' | 'pdf' | 'cheat-sheet' | 'book' | 'roadmap' | 'video' | 'link';
  url?: string;
  files?: string[];
  category: 'subject' | 'semester' | 'technology' | 'placement' | 'dsa' | 'web-dev' | 'ai-ml' | 'cp';
  semester?: number;
  tags: string[];
  downloadsCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface AuditLogDocument {
  id?: string;
  action: 'flagged_content' | 'ban_user' | 'override_approve';
  targetId: string;
  targetType: 'User' | 'Post' | 'Comment' | 'Resource';
  performedBy: string;
  reason: string;
  createdAt: string;
}
