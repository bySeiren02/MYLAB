import { useEffect } from 'react'
import { CircleMarker, MapContainer, Polyline, TileLayer, useMap } from 'react-leaflet'

function FitBounds({ points }) {
  const map = useMap()
  useEffect(() => {
    if (!points || points.length === 0) return
    const bounds = points.map((p) => [p.lat, p.lng])
    if (bounds.length === 1) {
      map.setView(bounds[0], 17)
    } else {
      map.fitBounds(bounds, { padding: [24, 24] })
    }
  }, [map, points])
  return null
}

export default function RunningMap({ currentPos, liveRoutePoints = [], selectedRoutePoints = [] }) {
  const route = selectedRoutePoints.length > 0 ? selectedRoutePoints : liveRoutePoints
  const center = currentPos
    ? [currentPos.lat, currentPos.lng]
    : route.length > 0
      ? [route[0].lat, route[0].lng]
      : [37.5665, 126.978]

  return (
    <div
      style={{
        height: 260,
        borderRadius: 14,
        overflow: 'hidden',
        border: '1px solid var(--border)',
        position: 'relative',
        zIndex: 0,
        boxShadow: '0 6px 22px rgba(0,0,0,0.08)',
      }}
    >
      <MapContainer
        center={center}
        zoom={15}
        style={{ height: '100%', width: '100%', filter: 'grayscale(1) contrast(0.92) brightness(1.01)', zIndex: 0 }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; OpenStreetMap contributors &copy; CARTO'
          url='https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png'
          crossOrigin='anonymous'
        />
        {route.length > 1 && (
          <Polyline
            positions={route.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#9ca3af', weight: 5, opacity: 0.16, lineCap: 'round', lineJoin: 'round' }}
          />
        )}
        {route.length > 1 && (
          <Polyline
            positions={route.map((p) => [p.lat, p.lng])}
            pathOptions={{ color: '#374151', weight: 2.6, opacity: 0.74, lineCap: 'round', lineJoin: 'round' }}
          />
        )}
        {route.length > 0 && (
          <CircleMarker
            center={[route[0].lat, route[0].lng]}
            radius={3.2}
            pathOptions={{ color: '#ffffff', weight: 1.4, fillColor: '#374151', fillOpacity: 0.95 }}
          />
        )}
        {route.length > 0 && (
          <CircleMarker
            center={[route[route.length - 1].lat, route[route.length - 1].lng]}
            radius={3.2}
            pathOptions={{ color: '#ffffff', weight: 1.4, fillColor: '#374151', fillOpacity: 0.95 }}
          />
        )}
        {currentPos && (
          <CircleMarker
            center={[currentPos.lat, currentPos.lng]}
            radius={2.8}
            pathOptions={{ color: '#ffffff', weight: 1.2, fillColor: '#2563eb', fillOpacity: 0.9 }}
          />
        )}
        <FitBounds points={currentPos ? [...route, currentPos] : route} />
      </MapContainer>
    </div>
  )
}
