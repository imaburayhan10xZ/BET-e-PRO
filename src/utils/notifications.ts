/**
 * Browser Notification and Sound Alert System for BetePro
 * Provides native OS-level browser push notifications and high-quality audio alerts.
 */

// Native HTML5 System Notification trigger
export function triggerSystemNotification(title: string, body: string, onClick?: () => void) {
  if (!('Notification' in window)) {
    return;
  }

  if (Notification.permission === 'granted') {
    try {
      const notification = new Notification(title, {
        body,
        icon: '/favicon.ico', // fallback to favicon or generic asset
        badge: '/favicon.ico',
        vibrate: [200, 100, 200],
        requireInteraction: false
      } as any);

      if (onClick) {
        notification.onclick = (e) => {
          e.preventDefault();
          window.focus();
          onClick();
        };
      }
    } catch (err) {
      console.warn('[BETEPRO] System Notification failed to trigger:', err);
    }
  }
}

// Request permissions for native browser notifications
export async function requestNotificationPermission(): Promise<NotificationPermission> {
  if (!('Notification' in window)) {
    return 'denied';
  }

  try {
    const permission = await Notification.requestPermission();
    return permission;
  } catch (err) {
    console.error('[BETEPRO] Failed to request notification permission:', err);
    return 'default';
  }
}

// Synthesizer audio alerts (highly reliable, no external mp3 assets needed)
export function playChimeSound(type: 'success' | 'alert' | 'info') {
  try {
    const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
    if (!AudioContextClass) return;
    const ctx = new AudioContextClass();

    if (type === 'success') {
      // Pleasant double high chime (for successful transaction/status updates)
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(523.25, ctx.currentTime); // C5
      osc1.frequency.setValueAtTime(659.25, ctx.currentTime + 0.1); // E5

      osc2.type = 'sine';
      osc2.frequency.setValueAtTime(783.99, ctx.currentTime); // G5
      osc2.frequency.setValueAtTime(1046.50, ctx.currentTime + 0.1); // C6

      gain.gain.setValueAtTime(0.12, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start();
      osc2.start();
      osc1.stop(ctx.currentTime + 0.45);
      osc2.stop(ctx.currentTime + 0.45);
    } else if (type === 'alert') {
      // High-attention double-tone beep (for admins: new deposit/withdraw pending)
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(880, ctx.currentTime); // A5
      osc.frequency.setValueAtTime(587.33, ctx.currentTime + 0.12); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.24); // A5

      gain.gain.setValueAtTime(0.18, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.5);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.55);
    } else {
      // Gentle bubble-pop notification sound
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(329.63, ctx.currentTime); // E4
      osc.frequency.exponentialRampToValueAtTime(659.25, ctx.currentTime + 0.15); // E5

      gain.gain.setValueAtTime(0.1, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + 0.3);
    }
  } catch (err) {
    console.warn('[BETEPRO] Audio synthesizer failed to play chime:', err);
  }
}
