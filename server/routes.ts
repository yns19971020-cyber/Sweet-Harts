import express, { type Express, type Request, type Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { storage } from './storage';
import { saveSubscription, removeSubscription, sendMessageNotification, getVapidPublicKey } from './pushService';
import { verifyPhoto } from './photoVerification';

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
      const { username, email, password, gender, category, location, profileImage, subscriptionPlan, paymentMethod, transactionRef, paymentProof } = req.body;

      const existingUser = await storage.getUserByEmail(email);
      if (existingUser) {
        return res.status(400).json({ error: 'Email already registered' });
      }

      const existingUsername = await storage.getUserByUsername(username);
      if (existingUsername) {
        return res.status(400).json({ error: 'Username already taken' });
      }

      const hashedPassword = await bcrypt.hash(password, 10);

      let photoVerificationResult = null;
      let photoSuspicious = false;
      
      if (profileImage) {
        try {
          photoVerificationResult = await verifyPhoto(profileImage);
          photoSuspicious = photoVerificationResult.isSuspicious || photoVerificationResult.recommendation !== 'approve';
          console.log('Photo verification result:', photoVerificationResult);
        } catch (err) {
          console.error('Photo verification failed:', err);
        }
      }

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
        photoSuspicious,
        photoVerificationNotes: photoVerificationResult ? JSON.stringify(photoVerificationResult) : null,
      });

      if (photoSuspicious && photoVerificationResult) {
        const admin = await storage.getAdminUser();
        if (admin) {
          const alertMessage = `⚠️ FAKE PHOTO ALERT!\n\nUser: ${username}\nEmail: ${email}\n\nAI Detection Results:\n- Suspicious: ${photoVerificationResult.isSuspicious ? 'YES' : 'NO'}\n- Confidence: ${photoVerificationResult.confidence}%\n- Recommendation: ${photoVerificationResult.recommendation.toUpperCase()}\n\nReasons:\n${photoVerificationResult.reasons.map(r => '• ' + r).join('\n')}\n\nPlease review this profile carefully before approving.`;
          
          await storage.sendMessage({
            senderId: user.id,
            receiverId: admin.id,
            message: alertMessage,
            messageType: 'system',
          });
          console.log('Fake photo alert sent to admin for user:', username);
        }
      }

      if (paymentMethod && transactionRef) {
        const planPrices: Record<string, number> = {
          '1month': 25,
          '3months': 50,
          '6months': 75,
          '12months': 100,
        };
        const amount = planPrices[subscriptionPlan] || 25;
        
        await storage.createSubscriptionPayment({
          userId: user.id,
          plan: subscriptionPlan,
          amount: amount * 100,
          paymentMethod,
          transactionRef,
          paymentProof,
          status: 'pending',
        });
        console.log('Subscription payment created for user:', username);
      }

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
      
      const user = await storage.updateUser(req.params.id as string, { verified, verifiedGender });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/users/:id/block', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { blocked } = req.body;
      
      const user = await storage.updateUser(req.params.id as string, { blocked });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/users/:id/subscription', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { subscriptionStatus, subscriptionExpiryDate } = req.body;
      
      const user = await storage.updateUser(req.params.id as string, { 
        subscriptionStatus,
        subscriptionExpiryDate: subscriptionExpiryDate ? new Date(subscriptionExpiryDate) : undefined,
      });
      
      res.json({ user: { ...user, password: undefined } });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/subscription-payments', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const payments = await storage.getPendingSubscriptionPayments();
      const paymentsWithUsers = await Promise.all(
        payments.map(async (p: any) => {
          const user = await storage.getUserById(p.userId);
          return { ...p, user: user ? { ...user, password: undefined } : null };
        })
      );
      res.json({ payments: paymentsWithUsers });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/admin/subscription-payments/:id/approve', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { userId, plan } = req.body;
      const planDurations: Record<string, number> = {
        '1month': 30,
        '3months': 90,
        '6months': 180,
        '12months': 365,
      };
      const days = planDurations[plan] || 30;
      const expiryDate = new Date();
      expiryDate.setDate(expiryDate.getDate() + days);
      
      await storage.approveSubscriptionPayment(req.params.id as string, userId, expiryDate);
      res.json({ success: true });
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
      await storage.approvePriceActivation(req.params.id as string, userId);
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
      
      await storage.approveFeaturedRequest(req.params.id as string, userId, expiryDate);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/bank-details', (req, res) => {
    const bank = req.query.bank;
    if (bank === 'commercial') {
      res.json({
        bankName: 'Commercial Bank',
        accountNumber: process.env.COMMERCIAL_BANK_ACCOUNT || '',
        accountName: process.env.COMMERCIAL_BANK_NAME || '',
        branch: process.env.COMMERCIAL_BANK_BRANCH || ''
      });
    } else {
      res.json({
        bankName: 'Sampath Bank',
        accountNumber: process.env.SAMPATH_BANK_ACCOUNT || '',
        accountName: process.env.SAMPATH_BANK_NAME || '',
        branch: process.env.SAMPATH_BANK_BRANCH || ''
      });
    }
  });

  app.post('/api/messages', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { message, attachment, messageType } = req.body;
      
      if (!message || message.length > 1000) {
        return res.status(400).json({ error: 'Message must be between 1 and 1000 characters' });
      }
      
      if (attachment) {
        const maxSize = 2 * 1024 * 1024;
        if (attachment.length > maxSize) {
          return res.status(400).json({ error: 'Attachment too large. Maximum 2MB allowed.' });
        }
        
        if (!attachment.startsWith('data:image/')) {
          return res.status(400).json({ error: 'Only image attachments are allowed' });
        }
      }
      
      const admin = await storage.getAdminUser();
      
      if (!admin) {
        return res.status(500).json({ error: 'Admin not found' });
      }

      const msg = await storage.sendMessage({
        senderId: req.user.id,
        receiverId: admin.id,
        message,
        messageType: messageType || 'text',
        attachment,
      });

      // Send push notification to admin
      try {
        await sendMessageNotification(req.user.id, admin.id, message);
      } catch (e) {
        console.log('Push notification failed (non-critical):', e);
      }

      res.json({ message: msg });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/messages', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const admin = await storage.getAdminUser();
      if (!admin) {
        return res.status(500).json({ error: 'Admin not found' });
      }

      const messages = await storage.getConversation(req.user.id, admin.id);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/messages/unread', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const count = await storage.getUnreadCount(req.user.id);
      res.json({ unreadCount: count });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.get('/api/admin/messages', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const messages = await storage.getMessages(req.user.id);
      res.json({ messages });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/admin/messages/:userId', authMiddleware, adminMiddleware, async (req: AuthRequest, res) => {
    try {
      const { message, attachment, messageType } = req.body;
      
      const msg = await storage.sendMessage({
        senderId: req.user.id,
        receiverId: req.params.userId as string,
        message,
        messageType: messageType || 'text',
        attachment,
      });

      res.json({ message: msg });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  app.put('/api/messages/read/:senderId', authMiddleware, async (req: AuthRequest, res) => {
    try {
      await storage.markMessagesAsRead(req.user.id, req.params.senderId as string);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });

  // Push Notification Routes
  app.get('/api/push/vapid-public-key', (req, res) => {
    res.json({ publicKey: getVapidPublicKey() });
  });

  app.post('/api/push/subscribe', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { subscription, deviceInfo } = req.body;
      const result = await saveSubscription(req.user.id, subscription, deviceInfo);
      res.json({ success: true, subscription: result });
    } catch (error: any) {
      console.error('Push subscription error:', error);
      res.status(500).json({ error: error.message });
    }
  });

  app.post('/api/push/unsubscribe', authMiddleware, async (req: AuthRequest, res) => {
    try {
      const { endpoint } = req.body;
      await removeSubscription(endpoint, req.user.id);
      res.json({ success: true });
    } catch (error: any) {
      res.status(500).json({ error: error.message });
    }
  });
}
