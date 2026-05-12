import { useState, useEffect, useCallback } from 'react';
import func2url from '../../backend/func2url.json';

const PUSH_URL: string = (func2url as Record<string, string>)['reviews-notify'] || '';

function urlBase64ToUint8Array(base64String: string): Uint8Array {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return Uint8Array.from([...rawData].map((c) => c.charCodeAt(0)));
}

export function usePushNotifications(userId: number | null) {
  const [isSupported, setIsSupported] = useState(false);
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [permission, setPermission] = useState<NotificationPermission>('default');

  useEffect(() => {
    const supported = 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window;
    setIsSupported(supported);
    if (supported) {
      setPermission(Notification.permission);
      checkSubscription();
    }
  }, [userId]);

  async function checkSubscription() {
    if (!('serviceWorker' in navigator)) return;
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    setIsSubscribed(!!sub);
  }

  const subscribe = useCallback(async () => {
    if (!userId || !PUSH_URL) return false;
    setIsLoading(true);

    try {
      const perm = await Notification.requestPermission();
      setPermission(perm);
      if (perm !== 'granted') return false;

      const keyRes = await fetch(`${PUSH_URL}?action=vapid-key`);
      const { public_key } = await keyRes.json();

      const reg = await navigator.serviceWorker.ready;
      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(public_key),
      });

      await fetch(`${PUSH_URL}?action=subscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, subscription: subscription.toJSON() }),
      });

      setIsSubscribed(true);
      return true;
    } catch (e) {
      console.error('[push]', e);
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  const unsubscribe = useCallback(async () => {
    if (!userId || !PUSH_URL) return;
    setIsLoading(true);

    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await fetch(`${PUSH_URL}?action=unsubscribe`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ user_id: userId, endpoint: sub.endpoint }),
      });
      await sub.unsubscribe();
    }

    setIsSubscribed(false);
    setIsLoading(false);
  }, [userId]);

  return { isSupported, isSubscribed, isLoading, permission, subscribe, unsubscribe };
}