import { db, isMock } from '../config/firebase';
import fs from 'fs';
import path from 'path';
import { 
  UserDocument, 
  PostDocument, 
  CommentDocument, 
  InterviewExperienceDocument, 
  ResourceDocument, 
  AuditLogDocument 
} from '../models/types';

const DATA_DIR = path.join(__dirname, '../../../data');

// Ensure local data directory exists if we are in mock mode
if (isMock && !fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

class MockCollection<T extends { id?: string; createdAt?: string; updatedAt?: string }> {
  private filepath: string;

  constructor(private collectionName: string) {
    this.filepath = path.join(DATA_DIR, `${collectionName}.json`);
    if (!fs.existsSync(this.filepath)) {
      fs.writeFileSync(this.filepath, JSON.stringify([]));
    }
  }

  private readAll(): T[] {
    try {
      const content = fs.readFileSync(this.filepath, 'utf8');
      return JSON.parse(content) as T[];
    } catch {
      return [];
    }
  }

  private writeAll(data: T[]) {
    fs.writeFileSync(this.filepath, JSON.stringify(data, null, 2));
  }

  async get(id: string): Promise<T | null> {
    const list = this.readAll();
    const item = list.find((x) => x.id === id);
    return item || null;
  }

  async findOne(filter: (item: T) => boolean): Promise<T | null> {
    const list = this.readAll();
    return list.find(filter) || null;
  }

  async findMany(filter?: (item: T) => boolean, limit?: number, sortByField?: keyof T, descending = true): Promise<T[]> {
    let list = this.readAll();
    if (filter) {
      list = list.filter(filter);
    }
    if (sortByField) {
      list.sort((a, b) => {
        const valA = a[sortByField] ?? '';
        const valB = b[sortByField] ?? '';
        if (valA < valB) return descending ? 1 : -1;
        if (valA > valB) return descending ? -1 : 1;
        return 0;
      });
    }
    if (limit) {
      list = list.slice(0, limit);
    }
    return list;
  }

  async add(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const list = this.readAll();
    const now = new Date().toISOString();
    const newItem = {
      ...data,
      id: Math.random().toString(36).substring(2, 15),
      createdAt: now,
      updatedAt: now
    } as unknown as T;
    list.push(newItem);
    this.writeAll(list);
    return newItem;
  }

  async set(id: string, data: T): Promise<T> {
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
    } else {
      list.push(updatedItem);
    }
    this.writeAll(list);
    return updatedItem;
  }

  async update(id: string, partial: Partial<T>): Promise<T | null> {
    const list = this.readAll();
    const index = list.findIndex((x) => x.id === id);
    if (index === -1) return null;
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

  async delete(id: string): Promise<boolean> {
    const list = this.readAll();
    const filtered = list.filter((x) => x.id !== id);
    if (list.length === filtered.length) return false;
    this.writeAll(filtered);
    return true;
  }
}

// Real Firestore Implementation Wrapper
class FirestoreCollection<T extends { id?: string; createdAt?: string; updatedAt?: string }> {
  constructor(private collectionName: string) {}

  private docData(doc: any): T {
    return { id: doc.id, ...doc.data() } as T;
  }

  async get(id: string): Promise<T | null> {
    const snap = await db.collection(this.collectionName).doc(id).get();
    if (!snap.exists) return null;
    return this.docData(snap);
  }

  async findOne(filter: (item: T) => boolean): Promise<T | null> {
    // Basic implementation (requires retrieval, can be optimized for real firestore calls where possible)
    const snap = await db.collection(this.collectionName).get();
    for (const doc of snap.docs) {
      const data = this.docData(doc);
      if (filter(data)) return data;
    }
    return null;
  }

  async findMany(filter?: (item: T) => boolean, limit?: number, sortByField?: keyof T, descending = true): Promise<T[]> {
    let query = db.collection(this.collectionName);
    if (sortByField) {
      query = query.orderBy(sortByField as string, descending ? 'desc' : 'asc');
    }
    if (limit) {
      query = query.limit(limit);
    }
    const snap = await query.get();
    let results: T[] = [];
    snap.forEach((doc: any) => {
      results.push(this.docData(doc));
    });
    if (filter) {
      results = results.filter(filter);
    }
    return results;
  }

  async add(data: Omit<T, 'id' | 'createdAt' | 'updatedAt'>): Promise<T> {
    const now = new Date().toISOString();
    const docRef = await db.collection(this.collectionName).add({
      ...data,
      createdAt: now,
      updatedAt: now
    });
    const snap = await docRef.get();
    return this.docData(snap);
  }

  async set(id: string, data: T): Promise<T> {
    const now = new Date().toISOString();
    const docRef = db.collection(this.collectionName).doc(id);
    await docRef.set({
      ...data,
      updatedAt: now
    }, { merge: true });
    const snap = await docRef.get();
    return this.docData(snap);
  }

  async update(id: string, partial: Partial<T>): Promise<T | null> {
    const now = new Date().toISOString();
    const docRef = db.collection(this.collectionName).doc(id);
    await docRef.update({
      ...partial,
      updatedAt: now
    });
    const snap = await docRef.get();
    return this.docData(snap);
  }

  async delete(id: string): Promise<boolean> {
    await db.collection(this.collectionName).doc(id).delete();
    return true;
  }
}

export const dbService = {
  users: isMock ? new MockCollection<UserDocument>('users') : new FirestoreCollection<UserDocument>('users'),
  posts: isMock ? new MockCollection<PostDocument>('posts') : new FirestoreCollection<PostDocument>('posts'),
  comments: isMock ? new MockCollection<CommentDocument>('comments') : new FirestoreCollection<CommentDocument>('comments'),
  interviews: isMock ? new MockCollection<InterviewExperienceDocument>('interviews') : new FirestoreCollection<InterviewExperienceDocument>('interviews'),
  resources: isMock ? new MockCollection<ResourceDocument>('resources') : new FirestoreCollection<ResourceDocument>('resources'),
  auditLogs: isMock ? new MockCollection<AuditLogDocument>('auditLogs') : new FirestoreCollection<AuditLogDocument>('auditLogs'),
};
