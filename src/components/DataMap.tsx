import { useEffect, useState } from 'react'
import { CircleMarker, MapContainer, Popup, TileLayer, useMap } from 'react-leaflet'
import { latLngBounds } from 'leaflet'
import 'leaflet/dist/leaflet.css'
import type { DataCenter } from '../lib/types'
import { JURISDICTION_LABEL } from '../lib/labels'

function Fit({ centers }: { centers: DataCenter[] }) {
  const map = useMap()
  useEffect(() => {
    if (!centers.length) return
    const b = latLngBounds(centers.map(c => [c.latitude, c.longitude] as [number, number]))
    map.fitBounds(b, { padding: [40, 40], maxZoom: 5 })
  }, [centers, map])
  return null
}

function WheelOnClick({ enabled }: { enabled: boolean }) {
  const map = useMap()
  useEffect(() => { if (enabled) map.scrollWheelZoom.enable(); else map.scrollWheelZoom.disable() }, [enabled, map])
  return null
}

export default function DataMap({ centers, vendorName }: { centers: DataCenter[]; vendorName: string }) {
  const [wheel, setWheel] = useState(false)
  return (
    <div style={{ height: "100%" }} onClick={() => setWheel(true)} onMouseLeave={() => setWheel(false)}>
      <MapContainer center={[30, 0]} zoom={2} scrollWheelZoom={false} style={{ height: '100%', width: '100%' }}>
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        <Fit centers={centers} />
        <WheelOnClick enabled={wheel} />
        {centers.map(c => (
          <CircleMarker key={c.id} center={[c.latitude, c.longitude]} radius={7}
            pathOptions={{ color: '#fff', weight: 2, fillColor: '#2F6BFF', fillOpacity: 1 }}>
            <Popup>
              <b>{vendorName}</b><br />{c.city}, {c.country}<br />
              {c.jurisdiction} · {JURISDICTION_LABEL[c.jurisdiction]} · {c.purpose}
            </Popup>
          </CircleMarker>
        ))}
      </MapContainer>
    </div>
  )
}
