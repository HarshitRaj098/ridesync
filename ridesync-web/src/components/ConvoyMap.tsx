import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, Tooltip, useMap } from 'react-leaflet'
import { BASE_LAT, BASE_LNG, ROUTE_POINTS, distanceFromLeaderKm, type Member } from '../data/mockData.ts'

/** Simulated congestion on the middle of the route (no live traffic API). */
const TRAFFIC_SEGMENT: Array<[number, number]> = [ROUTE_POINTS[2], ROUTE_POINTS[3], ROUTE_POINTS[4]]

function InvalidateSize() {
  const map = useMap()
  useEffect(() => {
    const t = setTimeout(() => map.invalidateSize(), 100)
    return () => clearTimeout(t)
  }, [map])
  return null
}

function Recenter({ center }: { center: [number, number] }) {
  const map = useMap()
  useEffect(() => {
    map.setView(center)
  }, [map, center])
  return null
}

/** Compass action: reset to the north-up default view — convoy centred,
 * zoom 13. Leaflet is always north-up, so "reset view" is what the single
 * compass honestly does. Fires only when the signal increments (> 0). */
function ResetView({ signal }: { signal: number }) {
  const map = useMap()
  useEffect(() => {
    if (signal > 0) map.setView([BASE_LAT, BASE_LNG], 13)
  }, [map, signal])
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
  center,
  satOn,
  trafficOn = false,
  resetView = 0,
}: {
  members: Member[]
  center: [number, number]
  satOn: boolean
  trafficOn?: boolean
  resetView?: number
}) {
  return (
    <div className="leaflet-map">
      <MapContainer center={[BASE_LAT, BASE_LNG]} zoom={13} zoomControl={false} attributionControl={false} style={{ height: '100%', width: '100%' }}>
        <InvalidateSize />
        <Recenter center={center} />
        <ResetView signal={resetView} />
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
          <Polyline positions={TRAFFIC_SEGMENT} pathOptions={{ color: '#EF4444', weight: 6, opacity: 0.85, lineCap: 'round' }} />
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
