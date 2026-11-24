import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import { distanceFromLeaderKm, type Member } from '../data/mockData.ts'

/** Default view when the rider's position is unknown: India, zoomed out.
 * This is only a viewport — it is not a trip, a route or a rider. */
export const DEFAULT_MAP_CENTER: [number, number] = [20.5937, 78.9629]
export const DEFAULT_MAP_ZOOM = 5

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100)
    // Phones change viewport height when the browser chrome collapses or
    // the orientation changes — without this the map can render half-grey.
    const onResize = () => map.invalidateSize()
    window.addEventListener('resize', onResize)
    window.addEventListener('orientationchange', onResize)
    return () => {
      clearTimeout(t)
      window.removeEventListener('resize', onResize)
      window.removeEventListener('orientationchange', onResize)
    }
  }, [map])
  return null
}

/** Compass action: jump back to the rider's real position when known,
 * otherwise to the default view, zoom 13 when positioned. */
function ResetView({ userPosition, signal }: { userPosition: [number, number] | null; signal: number }) {
  const map = useMap()
  useEffect(() => {
    if (signal <= 0) return
    if (userPosition) map.setView(userPosition, 13)
    else map.setView(DEFAULT_MAP_CENTER, DEFAULT_MAP_ZOOM)
  }, [map, userPosition, signal])
  return null
}

/** Recenter button: pan to the rider's real position, keeping the zoom;
 * with no position, pan back to the default view. */
function PanToUser({ userPosition, signal }: { userPosition: [number, number] | null; signal: number }) {
  const map = useMap()
  useEffect(() => {
    if (signal <= 0) return
    if (userPosition) map.panTo(userPosition, { animate: true })
    else map.panTo(DEFAULT_MAP_CENTER, { animate: true })
  }, [map, userPosition, signal])
  return null
}

/** A manual drag or zoom means the rider is looking around — stop
 * following until they tap recenter or the compass again. */
function UserMoveWatcher({ onUserMoved }: { onUserMoved: () => void }) {
  useMapEvents({
    dragstart: () => onUserMoved(),
    zoomstart: () => onUserMoved(),
  })
  return null
}

function markerIcon(member: Member): L.DivIcon {
  const isLeader = member.role === 'Leader'
  const size = isLeader ? 22 : 16
  const border = isLeader ? '3px solid #fff' : '2px solid #0a0e18'
  return L.divIcon({
    className: '',
    html: `<div title="${member.name}" style="width:${size}px;height:${size}px;border-radius:50%;background:${member.color};border:${border};box-shadow:0 0 12px ${member.color};"></div>`,
    iconSize: [size, size],
    iconAnchor: [size / 2, size / 2],
  })
}

export default function ConvoyMap({
  members,
  satOn,
  userPosition,
  onUserMoved = () => undefined,
  resetSignal = 0,
  panSignal = 0,
}: {
  /** Real members only. A member without a position has no marker. */
  members: Member[]
  satOn: boolean
  /** The rider's real GPS position, or null when unknown. */
  userPosition: [number, number] | null
  /** Called when the rider drags or zooms the map by hand. */
  onUserMoved?: () => void
  /** Bump to jump to the rider's position (compass). */
  resetSignal?: number
  /** Bump to pan to the rider's position, keeping the zoom (recenter). */
  panSignal?: number
}) {
  const initialCenter: [number, number] = userPosition ?? DEFAULT_MAP_CENTER
  const initialZoom = userPosition ? 13 : DEFAULT_MAP_ZOOM
  return (
    <div className="leaflet-map">
      <MapContainer center={initialCenter} zoom={initialZoom} zoomControl={false} attributionControl={false} style={{ height: '100%', width: '100%' }}>
        <InvalidateSize />
        <ResetView userPosition={userPosition} signal={resetSignal} />
        <PanToUser userPosition={userPosition} signal={panSignal} />
        <UserMoveWatcher onUserMoved={onUserMoved} />
        <TileLayer
          url={
            satOn
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          }
          maxZoom={19}
        />
        {members
          .filter((m) => m.lat !== undefined && m.lng !== undefined)
          .map((m) => (
            <Marker key={m.id} position={[m.lat as number, m.lng as number]} icon={markerIcon(m)}>
              <Tooltip direction="top" offset={[0, -10]}>
                {m.name} · {m.status === 'online' ? `${m.speedKmh} km/h` : m.status}
                {m.role !== 'Leader' ? ` · ${distanceFromLeaderKm(m, members).toFixed(1)} km from leader` : ' · Leader'}
              </Tooltip>
            </Marker>
          ))}
      </MapContainer>
      {userPosition ? null : (
        <div className="traffic-chip">📍 Your location is not on the map yet — turn on location sharing in Settings to see yourself here.</div>
      )}
    </div>
  )
}
