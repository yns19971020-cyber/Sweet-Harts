import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import { registerRoutes } from './routes';
import { registerChatRoutes } from './replit_integrations/chat';
import { registerImageRoutes } from './replit_integrations/image';
import { db } from './db';
import { sql } from 'drizzle-orm';
import bcrypt from 'bcryptjs';

const app = express();
const PORT = process.env.NODE_ENV === 'production' ? 5000 : 3001;

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

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS conversations (
      id SERIAL PRIMARY KEY,
      title TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
    )
  `);

  await db.execute(sql`
    CREATE TABLE IF NOT EXISTS chatbot_messages (
      id SERIAL PRIMARY KEY,
      conversation_id INTEGER REFERENCES conversations(id) ON DELETE CASCADE NOT NULL,
      role TEXT NOT NULL,
      content TEXT NOT NULL,
      created_at TIMESTAMP DEFAULT NOW() NOT NULL
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

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));
app.use(cookieParser());

const isProduction = process.env.NODE_ENV === 'production';

if (isProduction) {
  app.use(express.static('dist'));
  app.use(express.static('public'));
} else {
  app.use(express.static('public'));
  app.use('/src', express.static('src'));
}

registerRoutes(app);
registerChatRoutes(app);
registerImageRoutes(app);

app.get('/', (req, res) => {
  if (isProduction) {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  } else {
    res.sendFile(path.join(process.cwd(), 'index.html'));
  }
});

app.use((req, res) => {
  if (req.path.endsWith('.html')) {
    res.sendFile(path.join(process.cwd(), 'public', req.path));
  } else if (isProduction) {
    res.sendFile(path.join(process.cwd(), 'dist', 'index.html'));
  } else {
    res.sendFile(path.join(process.cwd(), 'index.html'));
  }
});

async function start() {
  try {
    await initDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`Server running on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

start();
