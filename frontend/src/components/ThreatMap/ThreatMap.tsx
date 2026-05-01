import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import type {LatLngBoundsExpression} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {ThreatRecord} from '../../types';

interface ThreatMapProps {
    threats: ThreatRecord[];
}

const worldBounds: LatLngBoundsExpression = [
    [-90, -180],
    [90, 180]
];

export function ThreatMap({threats}: ThreatMapProps) {
    return (
        <MapContainer
            center={[20, 0]}
            zoom={2.5}
            minZoom={2}
            maxBounds={worldBounds}
            maxBoundsViscosity={1.0}
            className="h-full w-full z-0 bg-slate-800"
        >

            <TileLayer
                url="https://tiles.stadiamaps.com/tiles/stamen_toner_dark/{z}/{x}/{y}{r}.png"
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