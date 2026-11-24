import { useDispatch, useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, Button, showToast } from '../components/ui.tsx'
import { logout, toggleSetting } from '../store/store.ts'
import type { RootState } from '../store/store.ts'
import { useNavigate } from 'react-router-dom'

export default function Settings() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const settings = useSelector((s: RootState) => s.settings)
  const user = useSelector((s: RootState) => s.auth.user)

  const rows: Array<{ key: 'darkMode' | 'notificationsEnabled' | 'locationSharing' | 'voiceEnabled'; title: string; detail: string }> = [
    { key: 'darkMode', title: 'Dark theme', detail: 'RideSync uses a dark theme by default' },
    { key: 'notificationsEnabled', title: 'Notifications', detail: 'Convoy alerts, messages and trip reminders' },
    { key: 'locationSharing', title: 'Live location sharing', detail: 'Share your position with the convoy while riding' },
    { key: 'voiceEnabled', title: 'Push-to-talk voice', detail: 'Group voice channel during a ride' },
  ]

  return (
    <div className="page">
      <AppHeader title="Settings" showBack />
      <div className="section-label"><h3>Preferences</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          {rows.map((r) => (
            <div className="setting-row" key={r.key}>
              <div><b>{r.title}</b><span>{r.detail}</span></div>
              <button
                className={`toggle${settings[r.key] ? ' on' : ''}`}
                role="switch"
                aria-checked={settings[r.key]}
                aria-label={r.title}
                onClick={() => dispatch(toggleSetting(r.key))}
              />
            </div>
          ))}
        </div>
      </div>

      <div className="section-label"><h3>Account</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          <div className="setting-row"><div><b>Signed in as</b><span>{user?.email ?? '—'}</span></div></div>
          <div className="setting-row"><div><b>Emergency contacts</b><span>2 contacts will receive SOS alerts</span></div><span className="link" onClick={() => showToast('Emergency contacts editor coming soon')}>Edit</span></div>
          <div className="setting-row"><div><b>About RideSync</b><span>Smart Convoy Management Platform · Web v0.1.0 (mock data)</span></div></div>
        </div>
      </div>

      <div className="form-wrap">
        <Button variant="danger" onClick={() => { dispatch(logout()); navigate('/login'); showToast('Signed out') }}>Logout</Button>
      </div>
      <BottomNavigation />
    </div>
  )
}
