import { useDispatch, useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, showToast } from '../components/ui.tsx'
import { markAllRead, markRead } from '../store/store.ts'
import type { RootState } from '../store/store.ts'

const ICONS: Record<string, { icon: string; cls: string }> = {
  warn: { icon: '⚠️', cls: 'warn' },
  danger: { icon: '🚨', cls: 'danger' },
  info: { icon: '💬', cls: '' },
  ok: { icon: '✅', cls: 'ok' },
}

export default function Notifications() {
  const dispatch = useDispatch()
  const { items, unreadCount } = useSelector((s: RootState) => s.notifications)

  return (
    <div className="page">
      <AppHeader title="Notifications" showBack />
      <div className="section-label">
        <h3>{unreadCount} unread</h3>
        <span className="link" onClick={() => { dispatch(markAllRead()); showToast('All notifications marked as read') }}>Mark all read</span>
      </div>
      <div className="list-wrap">
        {items.length === 0 ? (
          <p className="empty">No notifications yet.<br />Convoy alerts and messages will appear here.</p>
        ) : (
          items.map((n) => {
            const meta = ICONS[n.kind] ?? ICONS.info
            return (
              <div key={n.id} className={`list-card notif-row${n.unread ? ' unread' : ''}`} onClick={() => dispatch(markRead(n.id))} role="button" tabIndex={0}>
                <div className={`notif-ic ${meta.cls}`}>{meta.icon}</div>
                <div style={{ flex: 1 }}>
                  <b>{n.title}</b>
                  <span>{n.detail}</span>
                  <time>{n.time}</time>
                </div>
                {n.unread ? <span className="badge-dot" style={{ position: 'static', flexShrink: 0, marginTop: 6 }} /> : null}
              </div>
            )
          })
        )}
      </div>
      <BottomNavigation />
    </div>
  )
}
