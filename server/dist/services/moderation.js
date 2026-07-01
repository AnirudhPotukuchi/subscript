"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.moderateContent = void 0;
// Simple context-aware rule engine for profanity, spam, and doxxing
const PROFANITY_WORDS = [
    'abuse', 'fuck', 'shit', 'asshole', 'bitch', 'idiot', 'moron',
    'scam', 'crypto dump', 'earn fast cash', 'buy followers', 'cheap tokens',
    'dumbass', 'loser', 'cheat sheet leak', 'hacked exam'
];
const HATE_SPEECH_WORDS = [
    'retard', 'faggot', 'nigger', 'cunt', 'kill yourself', 'hate you'
];
const moderateContent = async (text) => {
    const lowercaseText = text.toLowerCase();
    const reasons = [];
    let toxicityScore = 0;
    let spamScore = 0;
    // 1. Doxxing check (Phone numbers, non-college emails, sensitive roll number formatting patterns)
    const phoneRegex = /(\+?\d{1,3}[-.\s]?)?\(?\d{3}\)?[-.\s]?\d{3}[-.\s]?\d{4}/g;
    const genericEmailRegex = /\b[A-Za-z0-9._%+-]+@(gmail|yahoo|outlook|hotmail)\.com\b/g;
    if (phoneRegex.test(text)) {
        toxicityScore += 0.4;
        reasons.push('Contains potential phone number (doxxing prevention)');
    }
    if (genericEmailRegex.test(text)) {
        toxicityScore += 0.3;
        reasons.push('Contains personal web email address (doxxing prevention)');
    }
    // 2. Abusive / Profane terminology check
    let profanityHits = 0;
    PROFANITY_WORDS.forEach((word) => {
        if (lowercaseText.includes(word)) {
            profanityHits++;
        }
    });
    if (profanityHits > 0) {
        toxicityScore += Math.min(0.2 * profanityHits, 0.6);
        reasons.push(`Contains unprofessional or profane terms (${profanityHits} hit(s))`);
    }
    // 3. Hate Speech Check
    let hateHits = 0;
    HATE_SPEECH_WORDS.forEach((word) => {
        if (lowercaseText.includes(word)) {
            hateHits++;
        }
    });
    if (hateHits > 0) {
        toxicityScore += 0.8;
        reasons.push('Contains potential harassment or hate speech terms.');
    }
    // 4. Spam / Promotional patterns
    const linkRegex = /https?:\/\/[^\s]+/g;
    const linkHits = (text.match(linkRegex) || []).length;
    if (linkHits > 2) {
        spamScore += 0.5;
        reasons.push('Contains multiple link postings (potential spam)');
    }
    const spamTriggers = ['make money', 'buy now', 'ref link', 'subscribe to my channel', 'follow for follow'];
    spamTriggers.forEach((trigger) => {
        if (lowercaseText.includes(trigger)) {
            spamScore += 0.4;
            reasons.push(`Spam trigger detected: "${trigger}"`);
        }
    });
    // Calculate final status
    let status = 'approved';
    if (toxicityScore >= 0.75 || spamScore >= 0.8) {
        status = 'flagged_hidden';
    }
    else if (toxicityScore >= 0.4 || spamScore >= 0.4) {
        status = 'pending_review';
    }
    // Ensure normal academic discussions with minor technical references are safe
    const confidenceScore = 0.95; // High confidence rule matching
    return {
        toxicityScore: Math.min(toxicityScore, 1.0),
        spamScore: Math.min(spamScore, 1.0),
        confidenceScore,
        status,
        reasons
    };
};
exports.moderateContent = moderateContent;
