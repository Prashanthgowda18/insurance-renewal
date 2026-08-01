import axios from 'axios';
import { notificationLogger } from '../utils/logger';

interface PushPayload {
  to?: string; // Expo push token or FCM token
  title: string;
  body: string;
  data?: Record<string, any>;
  sound?: 'default';
  priority?: 'high' | 'normal';
}

class PushService {
  private registeredTokens: Set<string> = new Set();

  public registerToken(token: string): void {
    if (token) {
      this.registeredTokens.add(token);
      notificationLogger.info(`Registered mobile push token: ${token.substring(0, 15)}...`);
    }
  }

  public unregisterToken(token: string): void {
    this.registeredTokens.delete(token);
  }

  // Send Push Notification to all registered mobile devices (Expo Push Notification API)
  public async sendNotification(title: string, body: string, data: Record<string, any> = {}): Promise<boolean> {
    try {
      notificationLogger.info(`[PUSH NOTIFICATION] Sending "${title}" to ${this.registeredTokens.size} mobile device(s)`);

      const messages: PushPayload[] = Array.from(this.registeredTokens).map(token => ({
        to: token,
        sound: 'default',
        priority: 'high',
        title,
        body,
        data,
      }));

      if (messages.length > 0) {
        await axios.post('https://exp.host/--/api/v2/push/send', messages, {
          headers: {
            'Accept': 'application/json',
            'Accept-encoding': 'gzip, deflate',
            'Content-Type': 'application/json',
          },
          timeout: 5000,
        }).catch(err => {
          notificationLogger.warn(`Expo push gateway returned non-critical warning: ${err.message}`);
        });
      }

      return true;
    } catch (error: any) {
      notificationLogger.error('Failed to dispatch push notification', error);
      return false;
    }
  }
}

export const pushService = new PushService();
