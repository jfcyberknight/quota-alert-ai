import { useState, useEffect } from 'react';
import { db } from '../firebase';
import { doc, setDoc, deleteDoc, getDoc } from 'firebase/firestore';

const VAPID_PUBLIC_KEY = import.meta.env.VITE_VAPID_PUBLIC_KEY;

function urlBase64ToUint8Array(base64String) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const rawData = window.atob(base64);
  return new Uint8Array([...rawData].map(c => c.charCodeAt(0)));
}

export function usePushNotifications(user) {
  const [status, setStatus] = useState('idle'); // idle | loading | granted | denied | unsupported

  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
      setStatus('unsupported'); return;
    }
    if (Notification.permission === 'denied') { setStatus('denied'); return; }

    // Check if already subscribed in Firestore
    getDoc(doc(db, 'pushSubscriptions', user.uid)).then(snap => {
      if (snap.exists()) setStatus('granted');
    });
  }, [user?.uid]);

  async function subscribe() {
    if (!user) return;
    setStatus('loading');
    try {
      const reg = await navigator.serviceWorker.register('/sw.js');
      await navigator.serviceWorker.ready;

      const permission = await Notification.requestPermission();
      if (permission !== 'granted') { setStatus('denied'); return; }

      const subscription = await reg.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: urlBase64ToUint8Array(VAPID_PUBLIC_KEY),
      });

      await setDoc(doc(db, 'pushSubscriptions', user.uid), {
        userId: user.uid,
        subscription: JSON.parse(JSON.stringify(subscription)),
        updatedAt: new Date().toISOString(),
      });
      setStatus('granted');
    } catch (e) {
      console.error('Push subscribe error:', e);
      setStatus('idle');
    }
  }

  async function unsubscribe() {
    if (!user) return;
    try {
      const reg = await navigator.serviceWorker.getRegistration('/sw.js');
      if (reg) {
        const sub = await reg.pushManager.getSubscription();
        if (sub) await sub.unsubscribe();
      }
      await deleteDoc(doc(db, 'pushSubscriptions', user.uid));
      setStatus('idle');
    } catch (e) {
      console.error('Push unsubscribe error:', e);
    }
  }

  return { status, subscribe, unsubscribe };
}
