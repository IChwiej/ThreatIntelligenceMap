import {MapContainer, TileLayer, Marker, Popup} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type {LatLngBoundsExpression} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {ThreatRecord} from '../../types';
import L from 'leaflet';

interface ThreatMapProps {
    threats: ThreatRecord[];
}

const worldBounds: LatLngBoundsExpression = [
    [-90, -180],
    [90, 180]
];

const createCustomClusterIcon = (cluster: { getChildCount: () => number }) => {
    const count = cluster.getChildCount();

    return L.divIcon({
        html: `
            <div class="flex items-center justify-center w-10 h-10 bg-slate-900 border-2 border-red-500 rounded-full text-red-500 font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)]">
                ${count}
            </div>
        `,
        className: 'bg-transparent',
        iconSize: L.point(40, 40, true),
    });
};

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

            <MarkerClusterGroup chunkedLoading={true} iconCreateFunction={createCustomClusterIcon}>
                {threats.map((threat) => (
                    <Marker
                        key={threat.ipDecimal}
                        position={[threat.location.latitude, threat.location.longitude]}
                    >
                        <Popup className="select-none">
                            <div className="font-bold text-red-600">Atak z: {threat.ipAddress}</div>
                            <div className="text-xs">{threat.location.city}, {threat.location.country}</div>
                        </Popup>
                    </Marker>
                ))}
            </MarkerClusterGroup>


        </MapContainer>
    );
}