import { useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, EmptyState, showToast } from '../components/ui.tsx'
import { notificationPermissionState, requestNotificationPermission } from '../services/notify.ts'
import { markAllRead, markRead } from '../store/store.ts'
import type { RootState } from '../store/store.ts'

const ICONS: Record<string, { icon: string; cls: string }> = {
  warn: { icon: '⚠️', cls: 'warn' },
  danger: { icon: '🚨', cls: 'danger' },
  info: { icon: '💬', cls: '' },
  ok: { icon: '✅', cls: 'ok' },
}

type Filter = 'all' | 'unread' | 'alerts'

export default function Notifications() {
  const dispatch = useDispatch()
  const { items, unreadCount } = useSelector((s: RootState) => s.notifications)
  const [filter, setFilter] = useState<Filter>('all')
  const [permission, setPermission] = useState(notificationPermissionState())

  const visible = items.filter((n) =>
    filter === 'all' ? true : filter === 'unread' ? n.unread : n.kind === 'warn' || n.kind === 'danger',
  )

  const enableBrowserNotifications = async () => {
    const result = await requestNotificationPermission()
    setPermission(result)
    if (result === 'granted') showToast('Browser notifications enabled')
    else if (result === 'denied') showToast('Browser notifications blocked — allow them in your browser settings')
    else showToast('Browser notifications are not supported in this browser')
  }

  return (
    <div className="page">
      <AppHeader title="Notifications" showBack />
      <div className="section-label">
        <h3>{unreadCount} unread</h3>
        <span className="link" onClick={() => { dispatch(markAllRead()); showToast('All notifications marked as read') }}>Mark all read</span>
      </div>

      <div className="filter-row" role="tablist" aria-label="Filter notifications">
        {(['all', 'unread', 'alerts'] as Filter[]).map((f) => (
          <button
            key={f}
            role="tab"
            aria-selected={filter === f}
            className={`filter-chip${filter === f ? ' active' : ''}`}
            onClick={() => setFilter(f)}
          >
            {f === 'all' ? 'All' : f === 'unread' ? `Unread (${unreadCount})` : 'Alerts'}
          </button>
        ))}
      </div>

      <div className="list-wrap">
        <div className="list-card notif-permission-row">
          <div><b>Browser notifications</b><span>{permission === 'granted' ? 'On — SOS, regroup and broadcast alerts will also pop up in your browser.' : permission === 'denied' ? 'Blocked in this browser.' : permission === 'unsupported' ? 'Not supported in this browser.' : 'Off — enable to get SOS, regroup and broadcast alerts as browser pop-ups.'}</span></div>
          {permission !== 'granted' ? (
            <button className="nt-join" onClick={() => void enableBrowserNotifications()}>Enable</button>
          ) : null}
        </div>
      </div>

      <div className="list-wrap">
        {visible.length === 0 ? (
          <EmptyState
            icon={filter === 'unread' ? '✅' : '🔔'}
            title={filter === 'unread' ? 'All caught up' : filter === 'alerts' ? 'No alerts' : 'No notifications yet'}
            detail={filter === 'unread' ? 'You have read every notification.' : 'Convoy alerts and messages will appear here.'}
          />
        ) : (
          visible.map((n) => {
            const meta = ICONS[n.kind] ?? ICONS.info
            return (
              <div key={n.id} className={`list-card notif-row${n.unread ? ' unread' : ''}`} onClick={() => dispatch(markRead(n.id))} role="button" tabIndex={0} onKeyDown={(e) => { if (e.key === 'Enter') dispatch(markRead(n.id)) }}>
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
