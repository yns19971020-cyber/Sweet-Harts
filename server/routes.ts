import express, { type Express, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import { getUncachableStripeClient, getStripePublishableKey } from './stripeClient';

const JWT_SECRET = process.env.JWT_SECRET || 'privateconnect-secret-key-2024';

interface AuthRequest extends Request {
  user?: any;
}

export function authMiddleware(req: AuthRequest, res: Response, next: any) {
  const token = req.cookies?.token || req.headers.authorization?.replace('Bearer ', '');
  
  if (!token) {
    return res.status(401).json({ error: 'Not authenticated' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET) as any;
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
}

export function adminMiddleware(req: AuthRequest, res: Response, next: any) {
  if (req.user?.role !== 'admin') {
    return res.status(403).json({ error: 'Admin access required' });
  }
  next();
}

export function registerRoutes(app: Express) {
  app.post('/api/auth/register', async (req, res) => {
    try {
      const { username, email, password, gender, category, location, profileImage, subscriptionPlan } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await storage.createUser({
        username,
        email,
        password: hashedPassword,
        gender,
        category,
        location,
        profileImage,
        subscriptionPlan,
        subscriptionStatus: 'pending',
        description: 'Free chat & voice available. Unlock WhatsApp for video calls!',
      });

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

      res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error: any) {
      console.error('Registration error:', error);
      res.status(500).json({ error: error.message || 'Registration failed' });
    }
  });

  app.post('/api/auth/login', async (req, res) => {
    try {
      const { email, password } = req.body;

      const user = await storage.getUserByEmail(email);
      if (!user) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      if (user.blocked) {
        return res.status(403).json({ error: 'Account blocked' });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ error: 'Invalid credentials' });
      }

      const token = jwt.sign({ id: user.id, email: user.email, role: user.role }, JWT_SECRET, { expiresIn: '30d' });

      res.cookie('token', token, { httpOnly: true, maxAge: 30 * 24 * 60 * 60 * 1000 });
      res.json({ user: { ...user, password: undefined }, token });
    } catch (error: any) {
      console.error('Login error:', error);
      res.status(500).json({ error: error.message || 'Login failed' });
    }
  });

  app.post('/api/auth/logout', (req, res) => {
    res.clearCookie('token');
    res.json({ success: true });
  });

  app.get('/api/auth/me', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/profiles', async (req, res) => {
    try {
      const { category, location, verified, featured, search, limit, offset } = req.query;
      
      const profiles = await storage.getPublicProfiles({
        category: category as string,
        location: location as string,
        verified: verified === 'true' ? true : undefined,
        featured: featured === 'true' ? true : undefined,
        search: search as string,
        limit: parseInt(limit as string) || 50,
        offset: parseInt(offset as string) || 0,
      });

      const publicProfiles = profiles.map(p => ({
        id: p.id,
        username: p.username,
        gender: p.gender,
        category: p.category,
        location: p.location,
        verified: p.verified,
        featured: p.featured,
        featuredStatus: p.featuredStatus,
        profileImage: p.profileImage,
        whatsappUnlockPrice: p.whatsappUnlockPrice,
        description: p.description,
        canSetPrice: p.canSetPrice,
        priceActivationStatus: p.priceActivationStatus,
        createdAt: p.createdAt,
      }));

      res.json({ profiles: publicProfiles });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/profiles/:id', async (req, res) => {
    try {
      const user = await storage.getUserById(req.params.id);
      if (!user || user.role === 'admin') {
        return res.status(404).json({ error: 'Profile not found' });
      }

      res.json({
        profile: {
          id: user.id,
          username: user.username,
          gender: user.gender,
          category: user.category,
          location: user.location,
          verified: user.verified,
          featured: user.featured,
          featuredStatus: user.featuredStatus,
          profileImage: user.profileImage,
          whatsappUnlockPrice: user.whatsappUnlockPrice,
          whatsappNumber: user.verified && user.canSetPrice ? user.whatsappNumber : null,
          description: user.description,
          canSetPrice: user.canSetPrice,
          priceActivationStatus: user.priceActivationStatus,
          createdAt: user.createdAt,
        }
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/user/profile', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { whatsappNumber, whatsappUnlockPrice, description } = req.body;
      
      const user = await storage.updateUser(req.user.id, {
        whatsappNumber,
        whatsappUnlockPrice,
        description,
      });

      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/user/wallet', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const user = await storage.getUserById(req.user.id);
      const transactions = await storage.getWalletTransactions(req.user.id);
      
      res.json({
        balance: user?.walletBalance || 0,
        transactions,
      });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/stripe/checkout', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { priceId, profileId, type } = req.body;
      const stripe = await getUncachableStripeClient();
      const user = await storage.getUserById(req.user.id);

      if (!user) {
        return res.status(404).json({ error: 'User not found' });
      }

      let customerId = user.stripeCustomerId;
      if (!customerId) {
        const customer = await stripe.customers.create({
          email: user.email,
          metadata: { userId: user.id },
        });
        customerId = customer.id;
        await storage.updateUser(user.id, { stripeCustomerId: customerId });
      }

      const baseUrl = `https://${process.env.REPLIT_DOMAINS?.split(',')[0]}`;

      if (type === 'whatsapp_unlock' && profileId) {
        const targetProfile = await storage.getUserById(profileId);
        if (!targetProfile) {
          return res.status(404).json({ error: 'Profile not found' });
        }

        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [{
            price_data: {
              currency: 'lkr',
              product_data: {
                name: `WhatsApp Unlock - ${targetProfile.username}`,
                description: 'Unlock WhatsApp contact for video calls',
              },
              unit_amount: (targetProfile.whatsappUnlockPrice || 500) * 100,
            },
            quantity: 1,
          }],
          mode: 'payment',
          success_url: `${baseUrl}/profile.html?id=${profileId}&unlocked=true`,
          cancel_url: `${baseUrl}/profile.html?id=${profileId}`,
          metadata: {
            type: 'whatsapp_unlock',
            buyerId: user.id,
            sellerId: profileId,
            amount: targetProfile.whatsappUnlockPrice?.toString() || '500',
          },
        });

        return res.json({ url: session.url });
      }

      if (type === 'subscription' && priceId) {
        const session = await stripe.checkout.sessions.create({
          customer: customerId,
          payment_method_types: ['card'],
          line_items: [{ price: priceId, quantity: 1 }],
          mode: 'subscription',
          success_url: `${baseUrl}/dashboard.html?subscription=success`,
          cancel_url: `${baseUrl}/dashboard.html?subscription=cancel`,
          metadata: {
            type: 'subscription',
            userId: user.id,
          },
        });

        return res.json({ url: session.url });
      }

      res.status(400).json({ error: 'Invalid checkout type' });
    } catch (error: any) {
      console.error('Checkout error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/stripe/publishable-key', async (req, res) => {
    try {
      const key = await getStripePublishableKey();
      res.json({ publishableKey: key });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/user/price-activation', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { paymentMethod, transactionRef, paymentProof } = req.body;
      
      await storage.createPriceActivationRequest({
        userId: req.user.id,
        paymentMethod,
        transactionRef,
        paymentProof,
      });

      res.json({ success: true, message: 'Price activation request submitted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/user/featured-request', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { plan, paymentMethod, transactionRef, paymentProof } = req.body;
      
      await storage.createFeaturedRequest({
        userId: req.user.id,
        plan,
        paymentMethod,
        transactionRef,
        paymentProof,
      });

      res.json({ success: true, message: 'Featured request submitted' });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/users', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { filter, search } = req.query;
      
      let options: any = { search: search as string };
      
      if (filter === 'pending') options.verified = false;
      if (filter === 'verified') options.verified = true;
      if (filter === 'featured') options.featured = true;
      
      const users = await storage.listUsers(options);
      
      res.json({ users: users.map(u => ({ ...u, password: undefined })) });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/users/:id/verify', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { verified, verifiedGender } = req.body;
      
      const user = await storage.updateUser(req.params.id, { verified, verifiedGender });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/users/:id/block', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { blocked } = req.body;
      
      const user = await storage.updateUser(req.params.id, { blocked });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/users/:id/subscription', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { subscriptionStatus, subscriptionExpiryDate } = req.body;
      
      const user = await storage.updateUser(req.params.id, { 
        subscriptionStatus,
        subscriptionExpiryDate: subscriptionExpiryDate ? new Date(subscriptionExpiryDate) : undefined,
      });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/price-activations', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const requests = await storage.getPendingPriceActivations();
      res.json({ requests });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/price-activations/:id/approve', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { userId } = req.body;
      await storage.approvePriceActivation(req.params.id, userId);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/featured-requests', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const requests = await storage.getPendingFeaturedRequests();
      res.json({ requests });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/featured-requests/:id/approve', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { userId, plan } = req.body;
      
      let expiryDate = new Date();
      if (plan === '24 Hours') expiryDate.setHours(expiryDate.getHours() + 24);
      else if (plan === '3 Days') expiryDate.setDate(expiryDate.getDate() + 3);
      else if (plan === '7 Days') expiryDate.setDate(expiryDate.getDate() + 7);
      
      await storage.approveFeaturedRequest(req.params.id, userId, expiryDate);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
