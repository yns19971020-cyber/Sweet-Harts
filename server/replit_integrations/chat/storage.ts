import { db } from "../../db";
import { sql } from "drizzle-orm";

export interface Conversation {
  id: number;
  title: string;
  createdAt: Date;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  role: string;
  content: string;
  createdAt: Date;
}

export interface IChatStorage {
  getConversation(id: number): Promise<Conversation | undefined>;
  getAllConversations(): Promise<Conversation[]>;
  createConversation(title: string): Promise<Conversation>;
  deleteConversation(id: number): Promise<void>;
  getMessagesByConversation(conversationId: number): Promise<ChatMessage[]>;
  createMessage(conversationId: number, role: string, content: string): Promise<ChatMessage>;
}

export const chatStorage: IChatStorage = {
  async getConversation(id: number) {
    const result = await db.execute(sql`SELECT * FROM conversations WHERE id = ${id}`);
    const row = result.rows[0] as any;
    if (!row) return undefined;
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
    };
  },

  async getAllConversations() {
    const result = await db.execute(sql`SELECT * FROM conversations ORDER BY created_at DESC`);
    return result.rows.map((row: any) => ({
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
    }));
  },

  async createConversation(title: string) {
    const result = await db.execute(sql`INSERT INTO conversations (title) VALUES (${title}) RETURNING *`);
    const row = result.rows[0] as any;
    return {
      id: row.id,
      title: row.title,
      createdAt: row.created_at,
    };
  },

  async deleteConversation(id: number) {
    await db.execute(sql`DELETE FROM chatbot_messages WHERE conversation_id = ${id}`);
    await db.execute(sql`DELETE FROM conversations WHERE id = ${id}`);
  },

  async getMessagesByConversation(conversationId: number) {
    const result = await db.execute(
      sql`SELECT * FROM chatbot_messages WHERE conversation_id = ${conversationId} ORDER BY created_at ASC`
    );
    return result.rows.map((row: any) => ({
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    }));
  },

  async createMessage(conversationId: number, role: string, content: string) {
    const result = await db.execute(
      sql`INSERT INTO chatbot_messages (conversation_id, role, content) VALUES (${conversationId}, ${role}, ${content}) RETURNING *`
    );
    const row = result.rows[0] as any;
    return {
      id: row.id,
      conversationId: row.conversation_id,
      role: row.role,
      content: row.content,
      createdAt: row.created_at,
    };
  },
};
