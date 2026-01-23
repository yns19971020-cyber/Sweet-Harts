import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { runMigrations } from 'stripe-replit-sync';
import { registerRoutes } from './routes';
import { getStripeSync } from './stripeClient';
import { WebhookHandlers } from './webhookHandlers';
import { db } from './db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = 3001;

async function initDatabase() {
  console.log('Initializing database...');
  
  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS users (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      email TEXT NOT NULL UNIQUE,
      password TEXT NOT NULL,
      username TEXT NOT NULL UNIQUE,
      gender TEXT NOT NULL,
      category TEXT NOT NULL,
      location TEXT,
      role TEXT DEFAULT 'user' NOT NULL,
      verified BOOLEAN DEFAULT FALSE,
      verified_gender TEXT,
      blocked BOOLEAN DEFAULT FALSE,
      profile_image TEXT,
      whatsapp_number TEXT,
      whatsapp_unlock_price INTEGER,
      description TEXT,
      stripe_customer_id TEXT,
      stripe_subscription_id TEXT,
      subscription_status TEXT DEFAULT 'pending',
      subscription_plan TEXT,
      subscription_expiry_date TIMESTAMP,
      wallet_balance INTEGER DEFAULT 0,
      bank_account TEXT,
      featured BOOLEAN DEFAULT FALSE,
      featured_status TEXT DEFAULT 'none',
      featured_expiry TIMESTAMP,
      price_activation_status TEXT DEFAULT 'none',
      can_set_price BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW(),
      updated_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS wallet_transactions (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) NOT NULL,
      type TEXT NOT NULL,
      amount INTEGER NOT NULL,
      description TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS whatsapp_unlocks (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      buyer_id UUID REFERENCES users(id) NOT NULL,
      seller_id UUID REFERENCES users(id) NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT,
      transaction_ref TEXT,
      status TEXT DEFAULT 'pending',
      stripe_payment_intent_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS subscription_payments (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) NOT NULL,
      plan TEXT NOT NULL,
      amount INTEGER NOT NULL,
      payment_method TEXT,
      transaction_ref TEXT,
      status TEXT DEFAULT 'pending',
      stripe_payment_intent_id TEXT,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS featured_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) NOT NULL,
      plan TEXT NOT NULL,
      payment_method TEXT,
      transaction_ref TEXT,
      payment_proof TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS price_activation_requests (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      user_id UUID REFERENCES users(id) NOT NULL,
      payment_method TEXT,
      transaction_ref TEXT,
      payment_proof TEXT,
      status TEXT DEFAULT 'pending',
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS messages (
      id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
      sender_id UUID REFERENCES users(id) NOT NULL,
      receiver_id UUID REFERENCES users(id) NOT NULL,
      message TEXT NOT NULL,
      message_type TEXT DEFAULT 'text',
      attachment TEXT,
      is_read BOOLEAN DEFAULT FALSE,
      created_at TIMESTAMP DEFAULT NOW()
    )
  `);

  const adminEmail = 'jayakodyarachchigemahisha@gmail.com';
  const existingAdmin = await db.execute(sql`SELECT * FROM users WHERE email = ${adminEmail}`);
  
  if (existingAdmin.rows.length === 0) {
    const hashedPassword = await bcrypt.hash('admin123', 10);
    await db.execute(sql`
      INSERT INTO users (email, password, username, gender, category, role, verified)
      VALUES (${adminEmail}, ${hashedPassword}, 'Admin', 'Other', 'Admin', 'admin', true)
    `);
    console.log('Admin account created');
  }

  console.log('Database tables ready');
}

async function initStripe() {
  const databaseUrl = process.env.DATABASE_URL;

  if (!databaseUrl) {
    console.warn('DATABASE_URL not set, skipping Stripe initialization');
    return;
  }

  try {
    console.log('Initializing Stripe schema...');
    await runMigrations({ 
      databaseUrl,
      schema: 'stripe'
    });
    console.log('Stripe schema ready');

    const stripeSync = await getStripeSync();

    try {
      console.log('Setting up managed webhook...');
      const webhookBaseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;
      const result = await stripeSync.findOrCreateManagedWebhook(
        `${webhookBaseUrl}/api/stripe/webhook`
      );
      if (result?.webhook?.url) {
        console.log(`Webhook configured: ${result.webhook.url}`);
      } else {
        console.log('Webhook setup skipped - no URL returned');
      }
    } catch (webhookError) {
      console.log('Webhook setup skipped:', webhookError instanceof Error ? webhookError.message : webhookError);
    }

    stripeSync.syncBackfill()
      .then(() => console.log('Stripe data synced'))
      .catch((err: any) => console.error('Error syncing Stripe data:', err));
  } catch (error) {
    console.error('Failed to initialize Stripe:', error);
  }
}

app.post(
  '/api/stripe/webhook',
  express.raw({ type: 'application/json' }),
  async (req, res) => {
    const signature = req.headers['stripe-signature'];

    if (!signature) {
      return res.status(400).json({ error: 'Missing stripe-signature' });
    }

    try {
      const sig = Array.isArray(signature) ? signature[0] : signature;

      if (!Buffer.isBuffer(req.body)) {
        console.error('STRIPE WEBHOOK ERROR: req.body is not a Buffer');
        return res.status(500).json({ error: 'Webhook processing error' });
      }

      await WebhookHandlers.processWebhook(req.body as Buffer, sig);
      res.status(200).json({ received: true });
    } catch (error: any) {
      console.error('Webhook error:', error.message);
      res.status(400).json({ error: 'Webhook processing error' });
    }
  }
);

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

app.use(express.static('public'));
app.use('/src', express.static('src'));

registerRoutes(app);

app.get('/', (req, res) => {
  res.sendFile(path.join(process.cwd(), 'index.html'));
});

app.use((req, res) => {
  if (req.path.endsWith('.html')) {
    res.sendFile(path.join(process.cwd(), 'public', req.path));
  } else {
    res.sendFile(path.join(process.cwd(), 'index.html'));
  }
});

async function start() {
  try {
    await initDatabase();
    await initStripe();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
