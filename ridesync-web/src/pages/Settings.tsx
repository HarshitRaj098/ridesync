import { useState, type FormEvent } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { AppHeader, BottomNavigation, Button, showToast } from '../components/ui.tsx'
import { notificationPermissionState, requestNotificationPermission } from '../services/notify.ts'
import { addContact, logout, removeContact, toggleSetting, updateContact } from '../store/store.ts'
import type { RootState } from '../store/store.ts'
import { useNavigate } from 'react-router-dom'

/** Phone numbers are validated loosely (digits, spaces, +, -) — there is
 * no messaging service yet, so a contact is a name + a number SOS can
 * list, not someone the app can actually call or text. */
function validPhone(phone: string): boolean {
  return /^\+?[0-9][0-9\s-]{5,18}$/.test(phone.trim())
}

export default function Settings() {
  const dispatch = useDispatch()
  const navigate = useNavigate()
  const settings = useSelector((s: RootState) => s.settings)
  const user = useSelector((s: RootState) => s.auth.user)
  const contacts = useSelector((s: RootState) => s.contacts.items)
  const [permission, setPermission] = useState(notificationPermissionState())
  const [contactName, setContactName] = useState('')
  const [contactPhone, setContactPhone] = useState('')
  const [contactError, setContactError] = useState('')
  const [editingId, setEditingId] = useState<string | null>(null)

  const saveContact = (e: FormEvent) => {
    e.preventDefault()
    const name = contactName.trim()
    const phone = contactPhone.trim()
    if (name.length < 2) { setContactError('Enter the contact’s name.'); return }
    if (!validPhone(phone)) { setContactError('Enter a valid phone number, e.g. +91 98765 43210.'); return }
    if (editingId) dispatch(updateContact({ id: editingId, name, phone }))
    else dispatch(addContact({ name, phone }))
    setContactName('')
    setContactPhone('')
    setContactError('')
    setEditingId(null)
    showToast(editingId ? 'Emergency contact updated' : 'Emergency contact added')
  }

  const startEdit = (id: string, name: string, phone: string) => {
    setEditingId(id)
    setContactName(name)
    setContactPhone(phone)
    setContactError('')
  }

  return (
    <div className="page">
      <AppHeader title="Settings" showBack />
      <div className="section-label"><h3>Preferences</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          <div className="setting-row">
            <div><b>Dark theme</b><span>Always on — RideSync is dark-only, there is no light theme to switch to</span></div>
            <span className="nt-pending" style={{ whiteSpace: 'nowrap' }}>Always on</span>
          </div>
          <div className="setting-row">
            <div><b>Notifications</b><span>Convoy alerts, messages and trip reminders — turning this off stops new in-app notifications and browser pop-ups</span></div>
            <button
              className={`toggle${settings.notificationsEnabled ? ' on' : ''}`}
              role="switch"
              aria-checked={settings.notificationsEnabled}
              aria-label="Notifications"
              onClick={() => dispatch(toggleSetting('notificationsEnabled'))}
            />
          </div>
          <div className="setting-row">
            <div><b>Live location sharing</b><span>Share your position with the convoy while riding — off means your position is hidden and no GPS is sent</span></div>
            <button
              className={`toggle${settings.locationSharing ? ' on' : ''}`}
              role="switch"
              aria-checked={settings.locationSharing}
              aria-label="Live location sharing"
              onClick={() => dispatch(toggleSetting('locationSharing'))}
            />
          </div>
          <div className="setting-row">
            <div><b>Push-to-talk voice</b><span>Group voice channel during a ride — off disables the mic button on the map</span></div>
            <button
              className={`toggle${settings.voiceEnabled ? ' on' : ''}`}
              role="switch"
              aria-checked={settings.voiceEnabled}
              aria-label="Push-to-talk voice"
              onClick={() => dispatch(toggleSetting('voiceEnabled'))}
            />
          </div>
        </div>
      </div>

      <p style={{ color: 'var(--text-faint)', fontSize: 11, padding: '0 20px', margin: '4px 0 0' }}>Preferences are saved in this browser and restored on your next visit.</p>

      <div className="section-label"><h3>Emergency Contacts · {contacts.length}</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          {contacts.length === 0 ? (
            <p style={{ color: 'var(--text-dim)', fontSize: 12, margin: '0 0 12px', lineHeight: 1.6 }}>
              No emergency contacts saved yet — SOS cannot list anyone until you add one. Contacts are stored
              only in this browser; they are listed for SOS, not messaged — no messaging service is connected yet.
            </p>
          ) : (
            contacts.map((c) => (
              <div className="request-row" key={c.id}>
                <div className="m-avatar">{c.name.slice(0, 2).toUpperCase()}</div>
                <div className="nt-info">
                  <b>{c.name}</b>
                  <span>{c.phone}</span>
                </div>
                <button className="nt-join" type="button" onClick={() => startEdit(c.id, c.name, c.phone)}>Edit</button>
                <button className="nt-cancel" type="button" onClick={() => { dispatch(removeContact(c.id)); showToast('Emergency contact removed') }}>Delete</button>
              </div>
            ))
          )}
          <form onSubmit={saveContact}>
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="ec-name">Contact name</label>
              <input id="ec-name" type="text" placeholder="e.g. Priya Sharma" value={contactName} onChange={(e) => { setContactName(e.target.value); if (contactError) setContactError('') }} />
            </div>
            <div className="field" style={{ marginBottom: 10 }}>
              <label htmlFor="ec-phone">Phone number</label>
              <input id="ec-phone" type="tel" placeholder="e.g. +91 98765 43210" value={contactPhone} onChange={(e) => { setContactPhone(e.target.value); if (contactError) setContactError('') }} />
            </div>
            {contactError ? <span className="error" role="alert" style={{ marginBottom: 10 }}>{contactError}</span> : null}
            <div style={{ display: 'flex', gap: 10 }}>
              <button className="nt-join" type="submit" style={{ flex: 1, padding: '11px' }}>{editingId ? 'Save changes' : 'Add contact'}</button>
              {editingId ? (
                <button className="nt-cancel" type="button" style={{ flex: 1, padding: '11px' }} onClick={() => { setEditingId(null); setContactName(''); setContactPhone(''); setContactError('') }}>Cancel</button>
              ) : null}
            </div>
          </form>
        </div>
      </div>

      <div className="section-label"><h3>Account</h3></div>
      <div className="list-wrap">
        <div className="list-card">
          <div className="setting-row">
            <div><b>Browser notifications</b><span>{permission === 'granted' ? 'Enabled' : permission === 'denied' ? 'Blocked in this browser' : permission === 'unsupported' ? 'Not supported in this browser' : 'Off — optional pop-ups for SOS, regroup and broadcasts'}</span></div>
            {permission !== 'granted' && permission !== 'unsupported' ? (
              <button className="nt-join" onClick={async () => { const r = await requestNotificationPermission(); setPermission(r); showToast(r === 'granted' ? 'Browser notifications enabled' : 'Browser notifications not enabled') }}>Enable</button>
            ) : null}
          </div>
          <div className="setting-row"><div><b>Signed in as</b><span>{user?.email ?? '—'}</span></div></div>
          <div className="setting-row"><div><b>About RideSync</b><span>Smart Convoy Management Platform · Web v0.1.0</span></div></div>
        </div>
      </div>

      <div className="form-wrap">
        <Button variant="danger" onClick={() => { dispatch(logout()); navigate('/login'); showToast('Signed out') }}>Logout</Button>
      </div>
      <BottomNavigation />
    </div>
  )
}
