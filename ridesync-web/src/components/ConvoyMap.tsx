import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap, useMapEvents } from 'react-leaflet'
import {
  ROUTE_POINTS,
  distanceFromLeaderKm,
  haversineKm,
  leaderOf,
  memberRoutePosition,
  nearestRouteIndex,
  type Member,
} from '../data/mockData.ts'

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

/**
 * Follow the leader: while follow is on, pan the map to the leader's live
 * position whenever they have moved a meaningful distance from the view
 * centre. Without this the map sat fixed on the Bhopal start point while
 * the convoy rode away — markers drifted off-screen.
 */
function FollowLeader({ members, follow }: { members: Member[]; follow: boolean }) {
  const map = useMap()
  useEffect(() => {
    if (!follow) return
    const leader = leaderOf(members)
    if (!leader) return
    const centre = map.getCenter()
    if (haversineKm(centre.lat, centre.lng, leader.lat, leader.lng) > 0.2) {
      map.panTo([leader.lat, leader.lng], { animate: true })
    }
  }, [map, members, follow])
  return null
}

/** Compass action: jump back to the leader's LIVE position, north-up,
 * zoom 13. The old version reset to the fixed Bhopal start point, so
 * after the convoy had ridden for a while the compass yanked the map
 * back to where the ride began. */
function ResetView({ members, signal }: { members: Member[]; signal: number }) {
  const map = useMap()
  useEffect(() => {
    if (signal <= 0) return
    const leader = leaderOf(members)
    if (leader) map.setView([leader.lat, leader.lng], 13)
  }, [map, members, signal])
  return null
}

/** Recenter button: pan to the leader's live position, keeping the zoom. */
function PanToLeader({ members, signal }: { members: Member[]; signal: number }) {
  const map = useMap()
  useEffect(() => {
    if (signal <= 0) return
    const leader = leaderOf(members)
    if (leader) map.panTo([leader.lat, leader.lng], { animate: true })
  }, [map, members, signal])
  return null
}

/** A manual drag or zoom means the rider is looking around — stop
 * following until they tap recenter or the compass again. Programmatic
 * pans (follow / recenter) do not fire dragstart/zoomstart. */
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
  trafficOn = false,
  follow = true,
  onUserMoved = () => undefined,
  resetSignal = 0,
  panSignal = 0,
}: {
  members: Member[]
  satOn: boolean
  trafficOn?: boolean
  /** When true the map pans to follow the leader as the convoy rides. */
  follow?: boolean
  /** Called when the rider drags or zooms the map by hand. */
  onUserMoved?: () => void
  /** Bump to jump to the leader, zoom 13 (compass). */
  resetSignal?: number
  /** Bump to pan to the leader, keeping the zoom (recenter). */
  panSignal?: number
}) {
  const leader = leaderOf(members)
  // The map opens on the convoy's live position (214 km into the trip),
  // not on the Bhopal start point — otherwise the markers start off-screen.
  const [initialLat, initialLng] = leader
    ? [leader.lat, leader.lng]
    : memberRoutePosition('rohit', 214, 612)
  // Simulated congestion on the stretch the convoy is actually riding
  // (the three route points nearest the leader), not a fixed segment.
  const trafficSegment: Array<[number, number]> = (() => {
    if (!leader) return [ROUTE_POINTS[2], ROUTE_POINTS[3], ROUTE_POINTS[4]]
    const i = nearestRouteIndex(leader.lat, leader.lng)
    const start = Math.max(0, Math.min(i - 1, ROUTE_POINTS.length - 3))
    return [ROUTE_POINTS[start], ROUTE_POINTS[start + 1], ROUTE_POINTS[start + 2]]
  })()
  return (
    <div className="leaflet-map">
      <MapContainer center={[initialLat, initialLng]} zoom={13} zoomControl={false} attributionControl={false} style={{ height: '100%', width: '100%' }}>
        <InvalidateSize />
        <FollowLeader members={members} follow={follow} />
        <ResetView members={members} signal={resetSignal} />
        <PanToLeader members={members} signal={panSignal} />
        <UserMoveWatcher onUserMoved={onUserMoved} />
        <TileLayer
          url={
            satOn
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          }
          maxZoom={19}
        />
        <Polyline positions={ROUTE_POINTS} pathOptions={{ color: '#00C2FF', weight: 3, opacity: 0.6, dashArray: '1 10', lineCap: 'round' }} />
        {trafficOn ? (
          <Polyline positions={trafficSegment} pathOptions={{ color: '#EF4444', weight: 6, opacity: 0.85, lineCap: 'round' }} />
        ) : null}
        {members.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon(m)}>
            <Tooltip direction="top" offset={[0, -10]}>
              {m.name} · {m.status === 'online' ? `${m.speedKmh} km/h` : m.status}
              {m.role !== 'Leader' ? ` · ${distanceFromLeaderKm(m, members).toFixed(1)} km from leader` : ' · Leader'}
            </Tooltip>
          </Marker>
        ))}
      </MapContainer>
      {trafficOn ? <div className="traffic-chip">🚦 Traffic — simulated, not live data</div> : null}
    </div>
  )
}
