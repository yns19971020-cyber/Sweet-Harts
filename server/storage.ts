import { users, walletTransactions, whatsappUnlocks, subscriptionPayments, featuredRequests, priceActivationRequests, messages } from './schema';
import { eq, sql, desc, and, or, ilike } from 'drizzle-orm';
import { db } from './db';
import type { User, InsertUser, Message } from './schema';

export class Storage {
  async getProduct(productId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE id = ${productId}`
    );
    return result.rows[0] || null;
  }

  async listProducts(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.products WHERE active = ${active} LIMIT ${limit} OFFSET ${offset}`
    );
    return result.rows;
  }

  async listProductsWithPrices(active = true, limit = 20, offset = 0) {
    const result = await db.execute(
      sql`
        WITH paginated_products AS (
          SELECT id, name, description, metadata, active
          FROM stripe.products
          WHERE active = ${active}
          ORDER BY id
          LIMIT ${limit} OFFSET ${offset}
        )
        SELECT 
          p.id as product_id,
          p.name as product_name,
          p.description as product_description,
          p.active as product_active,
          p.metadata as product_metadata,
          pr.id as price_id,
          pr.unit_amount,
          pr.currency,
          pr.recurring,
          pr.active as price_active,
          pr.metadata as price_metadata
        FROM paginated_products p
        LEFT JOIN stripe.prices pr ON pr.product = p.id AND pr.active = true
        ORDER BY p.id, pr.unit_amount
      `
    );
    return result.rows;
  }

  async getPrice(priceId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.prices WHERE id = ${priceId}`
    );
    return result.rows[0] || null;
  }

  async getSubscription(subscriptionId: string) {
    const result = await db.execute(
      sql`SELECT * FROM stripe.subscriptions WHERE id = ${subscriptionId}`
    );
    return result.rows[0] || null;
  }

  async createUser(data: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(data).returning();
    return user;
  }

  async getUserById(id: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user || null;
  }

  async getUserByEmail(email: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user || null;
  }

  async getUserByUsername(username: string): Promise<User | null> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user || null;
  }

  async updateUser(id: string, data: Partial<User>): Promise<User | null> {
    const [user] = await db.update(users).set({ ...data, updatedAt: new Date() }).where(eq(users.id, id)).returning();
    return user || null;
  }

  async listUsers(options: { 
    role?: string; 
    verified?: boolean; 
    category?: string;
    location?: string;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<User[]> {
    const { role, verified, category, location, featured, search, limit = 50, offset = 0 } = options;
    
    let query = db.select().from(users);
    const conditions = [];
    
    if (role) conditions.push(eq(users.role, role));
    if (verified !== undefined) conditions.push(eq(users.verified, verified));
    if (category) conditions.push(eq(users.category, category));
    if (location) conditions.push(eq(users.location, location));
    if (featured !== undefined) conditions.push(eq(users.featured, featured));
    if (search) {
      conditions.push(or(
        ilike(users.username, `%${search}%`),
        ilike(users.email, `%${search}%`)
      ));
    }
    
    if (conditions.length > 0) {
      query = query.where(and(...conditions)) as any;
    }
    
    return await query.orderBy(desc(users.createdAt)).limit(limit).offset(offset);
  }

  async getPublicProfiles(options: {
    category?: string;
    location?: string;
    verified?: boolean;
    featured?: boolean;
    search?: string;
    limit?: number;
    offset?: number;
  } = {}): Promise<User[]> {
    return this.listUsers({
      ...options,
      role: 'user',
    });
  }

  async addWalletTransaction(userId: string, type: string, amount: number, description?: string) {
    const [transaction] = await db.insert(walletTransactions).values({
      userId,
      type,
      amount,
      description,
      status: 'completed'
    }).returning();
    
    const user = await this.getUserById(userId);
    if (user) {
      await this.updateUser(userId, { walletBalance: (user.walletBalance || 0) + amount });
    }
    
    return transaction;
  }

  async getWalletTransactions(userId: string) {
    return await db.select().from(walletTransactions)
      .where(eq(walletTransactions.userId, userId))
      .orderBy(desc(walletTransactions.createdAt));
  }

  async createWhatsappUnlock(data: { buyerId: string; sellerId: string; amount: number; paymentMethod?: string; transactionRef?: string; stripePaymentIntentId?: string }) {
    const [unlock] = await db.insert(whatsappUnlocks).values(data).returning();
    return unlock;
  }

  async getWhatsappUnlocks(userId: string) {
    return await db.select().from(whatsappUnlocks)
      .where(or(eq(whatsappUnlocks.buyerId, userId), eq(whatsappUnlocks.sellerId, userId)))
      .orderBy(desc(whatsappUnlocks.createdAt));
  }

  async approveWhatsappUnlock(unlockId: string) {
    const [unlock] = await db.update(whatsappUnlocks)
      .set({ status: 'approved' })
      .where(eq(whatsappUnlocks.id, unlockId))
      .returning();
    return unlock;
  }

  async createPriceActivationRequest(data: { userId: string; paymentMethod?: string; transactionRef?: string; paymentProof?: string }) {
    const [request] = await db.insert(priceActivationRequests).values(data).returning();
    await this.updateUser(data.userId, { priceActivationStatus: 'pending' });
    return request;
  }

  async getPendingPriceActivations() {
    return await db.select().from(priceActivationRequests)
      .where(eq(priceActivationRequests.status, 'pending'))
      .orderBy(desc(priceActivationRequests.createdAt));
  }

  async approvePriceActivation(requestId: string, userId: string) {
    await db.update(priceActivationRequests).set({ status: 'approved' }).where(eq(priceActivationRequests.id, requestId));
    await this.updateUser(userId, { priceActivationStatus: 'approved', canSetPrice: true });
  }

  async createFeaturedRequest(data: { userId: string; plan: string; paymentMethod?: string; transactionRef?: string; paymentProof?: string }) {
    const [request] = await db.insert(featuredRequests).values(data).returning();
    await this.updateUser(data.userId, { featuredStatus: 'pending' });
    return request;
  }

  async getPendingFeaturedRequests() {
    return await db.select().from(featuredRequests)
      .where(eq(featuredRequests.status, 'pending'))
      .orderBy(desc(featuredRequests.createdAt));
  }

  async approveFeaturedRequest(requestId: string, userId: string, expiryDate: Date) {
    await db.update(featuredRequests).set({ status: 'approved' }).where(eq(featuredRequests.id, requestId));
    await this.updateUser(userId, { featured: true, featuredStatus: 'active', featuredExpiry: expiryDate });
  }

  async deleteUser(id: string) {
    await db.delete(users).where(eq(users.id, id));
  }

  async sendMessage(data: { senderId: string; receiverId: string; message: string; messageType?: string; attachment?: string }) {
    const [msg] = await db.insert(messages).values(data).returning();
    return msg;
  }

  async getMessages(userId: string) {
    return await db.select().from(messages)
      .where(or(eq(messages.senderId, userId), eq(messages.receiverId, userId)))
      .orderBy(desc(messages.createdAt));
  }

  async getConversation(userId1: string, userId2: string) {
    return await db.select().from(messages)
      .where(or(
        and(eq(messages.senderId, userId1), eq(messages.receiverId, userId2)),
        and(eq(messages.senderId, userId2), eq(messages.receiverId, userId1))
      ))
      .orderBy(messages.createdAt);
  }

  async markMessagesAsRead(receiverId: string, senderId: string) {
    await db.update(messages)
      .set({ isRead: true })
      .where(and(eq(messages.receiverId, receiverId), eq(messages.senderId, senderId)));
  }

  async getUnreadCount(userId: string) {
    const result = await db.execute(
      sql`SELECT COUNT(*) as count FROM messages WHERE receiver_id = ${userId} AND is_read = false`
    );
    return parseInt(result.rows[0]?.count as string || '0');
  }

  async getAdminUser(): Promise<User | null> {
    const [admin] = await db.select().from(users).where(eq(users.role, 'admin'));
    return admin || null;
  }
}

export const storage = new Storage();
