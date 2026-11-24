/**
 * Optional browser notifications (Week 6).
 * Local only: uses the Notification API when the user has granted
 * permission. No push server, no service worker, no backend — a
 * notification only fires while the app is open in this browser.
 */

export type NotificationPermissionState = 'default' | 'granted' | 'denied' | 'unsupported'

export function notificationPermissionState(): NotificationPermissionState {
  if (typeof Notification === 'undefined') return 'unsupported'
  return Notification.permission as NotificationPermissionState
}

export async function requestNotificationPermission(): Promise<NotificationPermissionState> {
  if (typeof Notification === 'undefined') return 'unsupported'
  try {
    const result = await Notification.requestPermission()
    return result as NotificationPermissionState
  } catch {
    return Notification.permission as NotificationPermissionState
  }
}

function notificationsEnabledInSettings(): boolean {
  try {
    const raw = localStorage.getItem('ridesync-settings')
    if (!raw) return true
    return (JSON.parse(raw) as { notificationsEnabled?: boolean }).notificationsEnabled !== false
  } catch {
    return true
  }
}

/** Show a browser notification if permitted and enabled in Settings. Silent no-op otherwise. */
export function browserNotify(title: string, body: string): void {
  try {
    if (typeof Notification === 'undefined') return
    if (Notification.permission !== 'granted') return
    if (!notificationsEnabledInSettings()) return
    new Notification(`RideSync — ${title}`, { body })
  } catch {
    // Notifications are best-effort; never break the app for them.
  }
}
