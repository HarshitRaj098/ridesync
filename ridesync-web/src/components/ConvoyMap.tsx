import { useEffect } from 'react'
import L from 'leaflet'
import { MapContainer, Marker, Polyline, TileLayer, useMap } from 'react-leaflet'
import { BASE_LAT, BASE_LNG, ROUTE_POINTS, type Member } from '../data/mockData.ts'

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
}: {
  members: Member[]
  center: [number, number]
  satOn: boolean
}) {
  return (
    <div className="leaflet-map">
      <MapContainer center={[BASE_LAT, BASE_LNG]} zoom={13} zoomControl={false} attributionControl={false} style={{ height: '100%', width: '100%' }}>
        <InvalidateSize />
        <Recenter center={center} />
        <TileLayer
          url={
            satOn
              ? 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
              : 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png'
          }
          maxZoom={19}
        />
        <Polyline positions={ROUTE_POINTS} pathOptions={{ color: '#00C2FF', weight: 3, opacity: 0.6, dashArray: '1 10', lineCap: 'round' }} />
        {members.map((m) => (
          <Marker key={m.id} position={[m.lat, m.lng]} icon={markerIcon(m)} />
        ))}
      </MapContainer>
    </div>
  )
}
