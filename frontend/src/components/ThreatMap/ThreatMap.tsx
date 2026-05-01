import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import type {ThreatRecord} from '../../types';

interface ThreatMapProps {
    threats: ThreatRecord[];
}

export function ThreatMap({threats}: ThreatMapProps) {
    return (
        <MapContainer
            center={[20, 0]}
            zoom={2}
            className="h-full w-full z-0 bg-slate-800"
        >

            <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            />

            {threats.map((threat) => (
                <Marker
                    key={threat.ipDecimal}
                    position={[threat.location.latitude, threat.location.longitude]}
                >
                    <Popup>
                        <div className="font-bold text-red-600">Atak z: {threat.ipAddress}</div>
                        <div className="text-xs">{threat.location.city}, {threat.location.country}</div>
                    </Popup>
                </Marker>
            ))}
        </MapContainer>
    );
}