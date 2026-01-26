import webpush from 'web-push';
import { db } from './db';
import { pushSubscriptions, notifications, users } from './schema';
import { eq, and } from 'drizzle-orm';

const vapidPublicKey = process.env.VAPID_PUBLIC_KEY || '';
const vapidPrivateKey = process.env.VAPID_PRIVATE_KEY || '';
let vapidConfigured = false;

if (vapidPublicKey && vapidPrivateKey) {
  webpush.setVapidDetails(
    'mailto:support@sweethearts.lk',
    vapidPublicKey,
    vapidPrivateKey
  );
  vapidConfigured = true;
  console.log('Web Push VAPID keys configured successfully');
} else {
  console.warn('Warning: VAPID keys not configured. Push notifications will not work.');
}

export async function saveSubscription(userId: string, subscription: {
  endpoint: string;
  keys: { p256dh: string; auth: string };
}, deviceInfo?: string) {
  const existing = await db.select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.endpoint, subscription.endpoint))
    .limit(1);

  if (existing.length > 0) {
    await db.update(pushSubscriptions)
      .set({ 
        userId,
        isActive: true,
        updatedAt: new Date()
      })
      .where(eq(pushSubscriptions.endpoint, subscription.endpoint));
    return existing[0];
  }

  const [result] = await db.insert(pushSubscriptions).values({
    userId,
    endpoint: subscription.endpoint,
    p256dh: subscription.keys.p256dh,
    auth: subscription.keys.auth,
    deviceInfo
  }).returning();

  return result;
}

export async function removeSubscription(endpoint: string, userId: string) {
  await db.update(pushSubscriptions)
    .set({ isActive: false })
    .where(and(
      eq(pushSubscriptions.endpoint, endpoint),
      eq(pushSubscriptions.userId, userId)
    ));
}

export async function sendPushNotification(userId: string, payload: {
  title: string;
  body: string;
  type: string;
  url?: string;
  relatedId?: string;
}) {
  const [notification] = await db.insert(notifications).values({
    userId,
    title: payload.title,
    body: payload.body,
    type: payload.type,
    relatedId: payload.relatedId
  }).returning();

  const subs = await db.select()
    .from(pushSubscriptions)
    .where(eq(pushSubscriptions.userId, userId));

  const activeSubs = subs.filter(s => s.isActive);

  for (const sub of activeSubs) {
    try {
      await webpush.sendNotification(
        {
          endpoint: sub.endpoint,
          keys: {
            p256dh: sub.p256dh,
            auth: sub.auth
          }
        },
        JSON.stringify({
          title: payload.title,
          body: payload.body,
          url: payload.url || '/',
          notificationId: notification.id,
          tag: payload.type
        })
      );

      await db.update(notifications)
        .set({ isSent: true })
        .where(eq(notifications.id, notification.id));
    } catch (error: any) {
      console.error('Push notification failed:', error);
      if (error.statusCode === 410 || error.statusCode === 404) {
        await db.update(pushSubscriptions)
          .set({ isActive: false })
          .where(eq(pushSubscriptions.id, sub.id));
      }
    }
  }

  return notification;
}

export async function sendMessageNotification(senderId: string, receiverId: string, messagePreview: string) {
  const sender = await db.select()
    .from(users)
    .where(eq(users.id, senderId))
    .limit(1);

  const senderName = sender[0]?.username || 'Someone';

  return sendPushNotification(receiverId, {
    title: `New message from ${senderName}`,
    body: messagePreview.substring(0, 100),
    type: 'message',
    url: '/dashboard.html?tab=messages',
    relatedId: senderId
  });
}

export async function sendCallNotification(callerId: string, receiverId: string, callType: string) {
  const caller = await db.select()
    .from(users)
    .where(eq(users.id, callerId))
    .limit(1);

  const callerName = caller[0]?.username || 'Someone';

  return sendPushNotification(receiverId, {
    title: `Incoming ${callType} call`,
    body: `${callerName} is calling you`,
    type: 'call',
    url: `/call.html?caller=${callerId}&type=${callType}`,
    relatedId: callerId
  });
}

export function getVapidPublicKey() {
  return vapidPublicKey;
}
