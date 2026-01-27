import { pgTable, text, timestamp, boolean, integer, jsonb, uuid } from 'drizzle-orm/pg-core';

export const users = pgTable('users', {
  id: uuid('id').defaultRandom().primaryKey(),
  email: text('email').notNull().unique(),
  password: text('password').notNull(),
  username: text('username').notNull().unique(),
  gender: text('gender').notNull(),
  category: text('category').notNull(),
  location: text('location'),
  role: text('role').default('user').notNull(),
  verified: boolean('verified').default(false),
  verifiedGender: text('verified_gender'),
  blocked: boolean('blocked').default(false),
  profileImage: text('profile_image'),
  whatsappNumber: text('whatsapp_number'),
  whatsappUnlockPrice: integer('whatsapp_unlock_price'),
  description: text('description'),
  stripeCustomerId: text('stripe_customer_id'),
  stripeSubscriptionId: text('stripe_subscription_id'),
  subscriptionStatus: text('subscription_status').default('pending'),
  subscriptionPlan: text('subscription_plan'),
  subscriptionExpiryDate: timestamp('subscription_expiry_date'),
  walletBalance: integer('wallet_balance').default(0),
  bankAccount: text('bank_account'),
  featured: boolean('featured').default(false),
  featuredStatus: text('featured_status').default('none'),
  featuredExpiry: timestamp('featured_expiry'),
  priceActivationStatus: text('price_activation_status').default('none'),
  canSetPrice: boolean('can_set_price').default(false),
  photoSuspicious: boolean('photo_suspicious').default(false),
  photoVerificationNotes: text('photo_verification_notes'),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const walletTransactions = pgTable('wallet_transactions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  type: text('type').notNull(),
  amount: integer('amount').notNull(),
  description: text('description'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const whatsappUnlocks = pgTable('whatsapp_unlocks', {
  id: uuid('id').defaultRandom().primaryKey(),
  buyerId: uuid('buyer_id').references(() => users.id).notNull(),
  sellerId: uuid('seller_id').references(() => users.id).notNull(),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method'),
  transactionRef: text('transaction_ref'),
  status: text('status').default('pending'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const subscriptionPayments = pgTable('subscription_payments', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  plan: text('plan').notNull(),
  amount: integer('amount').notNull(),
  paymentMethod: text('payment_method'),
  transactionRef: text('transaction_ref'),
  status: text('status').default('pending'),
  stripePaymentIntentId: text('stripe_payment_intent_id'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const featuredRequests = pgTable('featured_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  plan: text('plan').notNull(),
  paymentMethod: text('payment_method'),
  transactionRef: text('transaction_ref'),
  paymentProof: text('payment_proof'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const priceActivationRequests = pgTable('price_activation_requests', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  paymentMethod: text('payment_method'),
  transactionRef: text('transaction_ref'),
  paymentProof: text('payment_proof'),
  status: text('status').default('pending'),
  createdAt: timestamp('created_at').defaultNow(),
});

export const messages = pgTable('messages', {
  id: uuid('id').defaultRandom().primaryKey(),
  senderId: uuid('sender_id').references(() => users.id).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id).notNull(),
  message: text('message').notNull(),
  messageType: text('message_type').default('text'),
  attachment: text('attachment'),
  isRead: boolean('is_read').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const pushSubscriptions = pgTable('push_subscriptions', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  deviceInfo: text('device_info'),
  isActive: boolean('is_active').default(true),
  createdAt: timestamp('created_at').defaultNow(),
  updatedAt: timestamp('updated_at').defaultNow(),
});

export const notifications = pgTable('notifications', {
  id: uuid('id').defaultRandom().primaryKey(),
  userId: uuid('user_id').references(() => users.id).notNull(),
  title: text('title').notNull(),
  body: text('body').notNull(),
  type: text('type').notNull(),
  relatedId: uuid('related_id'),
  isRead: boolean('is_read').default(false),
  isSent: boolean('is_sent').default(false),
  createdAt: timestamp('created_at').defaultNow(),
});

export const calls = pgTable('calls', {
  id: uuid('id').defaultRandom().primaryKey(),
  callerId: uuid('caller_id').references(() => users.id).notNull(),
  receiverId: uuid('receiver_id').references(() => users.id).notNull(),
  callType: text('call_type').notNull(),
  status: text('status').default('pending'),
  startTime: timestamp('start_time'),
  endTime: timestamp('end_time'),
  duration: integer('duration'),
  createdAt: timestamp('created_at').defaultNow(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;
export type Message = typeof messages.$inferSelect;
export type PushSubscription = typeof pushSubscriptions.$inferSelect;
export type Notification = typeof notifications.$inferSelect;
export type Call = typeof calls.$inferSelect;
