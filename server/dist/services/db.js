"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.dbService = void 0;
const firebase_1 = require("../config/firebase");
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const DATA_DIR = path_1.default.join(__dirname, '../../../data');
// Ensure local data directory exists if we are in mock mode
if (firebase_1.isMock && !fs_1.default.existsSync(DATA_DIR)) {
    fs_1.default.mkdirSync(DATA_DIR, { recursive: true });
}
class MockCollection {
    collectionName;
    filepath;
    constructor(collectionName) {
        this.collectionName = collectionName;
        this.filepath = path_1.default.join(DATA_DIR, `${collectionName}.json`);
        if (!fs_1.default.existsSync(this.filepath)) {
            fs_1.default.writeFileSync(this.filepath, JSON.stringify([]));
        }
    }
    readAll() {
        try {
            const content = fs_1.default.readFileSync(this.filepath, 'utf8');
            return JSON.parse(content);
        }
        catch {
            return [];
        }
    }
    writeAll(data) {
        fs_1.default.writeFileSync(this.filepath, JSON.stringify(data, null, 2));
    }
    async get(id) {
        const list = this.readAll();
        const item = list.find((x) => x.id === id);
        return item || null;
    }
    async findOne(filter) {
        const list = this.readAll();
        return list.find(filter) || null;
    }
    async findMany(filter, limit, sortByField, descending = true) {
        let list = this.readAll();
        if (filter) {
            list = list.filter(filter);
        }
        if (sortByField) {
            list.sort((a, b) => {
                const valA = a[sortByField] ?? '';
                const valB = b[sortByField] ?? '';
                if (valA < valB)
                    return descending ? 1 : -1;
                if (valA > valB)
                    return descending ? -1 : 1;
                return 0;
            });
        }
        if (limit) {
            list = list.slice(0, limit);
        }
        return list;
    }
    async add(data) {
        const list = this.readAll();
        const now = new Date().toISOString();
        const newItem = {
            ...data,
            id: Math.random().toString(36).substring(2, 15),
            createdAt: now,
            updatedAt: now
        };
        list.push(newItem);
        this.writeAll(list);
        return newItem;
    }
    async set(id, data) {
        const list = this.readAll();
        const index = list.findIndex((x) => x.id === id);
        const now = new Date().toISOString();
        const updatedItem = {
            ...data,
            id,
            updatedAt: now
        };
        if (index > -1) {
            list[index] = updatedItem;
        }
        else {
            list.push(updatedItem);
        }
        this.writeAll(list);
        return updatedItem;
    }
    async update(id, partial) {
        const list = this.readAll();
        const index = list.findIndex((x) => x.id === id);
        if (index === -1)
            return null;
        const now = new Date().toISOString();
        const updated = {
            ...list[index],
            ...partial,
            updatedAt: now
        };
        list[index] = updated;
        this.writeAll(list);
        return updated;
    }
    async delete(id) {
        const list = this.readAll();
        const filtered = list.filter((x) => x.id !== id);
        if (list.length === filtered.length)
            return false;
        this.writeAll(filtered);
        return true;
    }
}
// Real Firestore Implementation Wrapper
class FirestoreCollection {
    collectionName;
    constructor(collectionName) {
        this.collectionName = collectionName;
    }
    docData(doc) {
        return { id: doc.id, ...doc.data() };
    }
    async get(id) {
        const snap = await firebase_1.db.collection(this.collectionName).doc(id).get();
        if (!snap.exists)
            return null;
        return this.docData(snap);
    }
    async findOne(filter) {
        // Basic implementation (requires retrieval, can be optimized for real firestore calls where possible)
        const snap = await firebase_1.db.collection(this.collectionName).get();
        for (const doc of snap.docs) {
            const data = this.docData(doc);
            if (filter(data))
                return data;
        }
        return null;
    }
    async findMany(filter, limit, sortByField, descending = true) {
        let query = firebase_1.db.collection(this.collectionName);
        if (sortByField) {
            query = query.orderBy(sortByField, descending ? 'desc' : 'asc');
        }
        if (limit) {
            query = query.limit(limit);
        }
        const snap = await query.get();
        let results = [];
        snap.forEach((doc) => {
            results.push(this.docData(doc));
        });
        if (filter) {
            results = results.filter(filter);
        }
        return results;
    }
    async add(data) {
        const now = new Date().toISOString();
        const docRef = await firebase_1.db.collection(this.collectionName).add({
            ...data,
            createdAt: now,
            updatedAt: now
        });
        const snap = await docRef.get();
        return this.docData(snap);
    }
    async set(id, data) {
        const now = new Date().toISOString();
        const docRef = firebase_1.db.collection(this.collectionName).doc(id);
        await docRef.set({
            ...data,
            updatedAt: now
        }, { merge: true });
        const snap = await docRef.get();
        return this.docData(snap);
    }
    async update(id, partial) {
        const now = new Date().toISOString();
        const docRef = firebase_1.db.collection(this.collectionName).doc(id);
        await docRef.update({
            ...partial,
            updatedAt: now
        });
        const snap = await docRef.get();
        return this.docData(snap);
    }
    async delete(id) {
        await firebase_1.db.collection(this.collectionName).doc(id).delete();
        return true;
    }
}
exports.dbService = {
    users: firebase_1.isMock ? new MockCollection('users') : new FirestoreCollection('users'),
    posts: firebase_1.isMock ? new MockCollection('posts') : new FirestoreCollection('posts'),
    comments: firebase_1.isMock ? new MockCollection('comments') : new FirestoreCollection('comments'),
    interviews: firebase_1.isMock ? new MockCollection('interviews') : new FirestoreCollection('interviews'),
    resources: firebase_1.isMock ? new MockCollection('resources') : new FirestoreCollection('resources'),
    auditLogs: firebase_1.isMock ? new MockCollection('auditLogs') : new FirestoreCollection('auditLogs'),
};
