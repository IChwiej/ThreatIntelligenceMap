import {useEffect, useState} from 'react';
import {MapContainer, TileLayer, Marker, Popup, useMap} from 'react-leaflet';
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

function MapViewUpdater({center, onTransitionStart, onTransitionEnd}: {
    center: [number, number],
    onTransitionStart: () => void,
    onTransitionEnd: () => void
}) {
    const map = useMap();

    useEffect(() => {
        const currentCenter = map.getCenter();
        const targetCenter = L.latLng(center[0], center[1]);
        const distance = currentCenter.distanceTo(targetCenter);

        if (distance > 500000) {
            onTransitionStart();

            map.once('moveend', () => {
                onTransitionEnd();
            });

            setTimeout(() => {
                map.flyTo(center, map.getZoom(), {duration: 2});
            }, 300);
        } else {
            map.flyTo(center, map.getZoom());
        }
    }, [center, map, onTransitionStart, onTransitionEnd]);

    return null;
}

export function ThreatMap({threats}: ThreatMapProps) {
    const [currentCenter, setCurrentCenter] = useState<[number, number]>([18.30, -64.83]);


    const [isTransitioning, setIsTransitioning] = useState(false);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentCenter([position.coords.latitude, position.coords.longitude]);
                },
                (error) => {
                    console.info("Nie użyto geolokalizacji, pozostawiono domyślne współrzędne.", error.message);
                },
                {timeout: 5000}
            );
        }
    }, []);

    return (
        <div className="relative h-full w-full">

            <div
                className={`absolute inset-0 z-50 bg-slate-950/90 transition-opacity duration-500 ease-in-out flex items-center justify-center pointer-events-none 
                    ${isTransitioning ? 'opacity-100' : 'opacity-0'}`}
            >
                <div className="text-xl text-red-500 font-semibold">Pobieranie Twojej lokalizacji...</div>
            </div>

            <MapContainer
                center={currentCenter}
                zoom={16}
                minZoom={2}
                maxBounds={worldBounds}
                maxBoundsViscosity={1.0}
                className="h-full w-full z-0 bg-slate-800"
            >
                <MapViewUpdater
                    center={currentCenter}
                    onTransitionStart={() => setIsTransitioning(true)}
                    onTransitionEnd={() => setIsTransitioning(false)}
                />

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
                                <div className="text-xs">{threat.location.city}, {threat.location.country} –
                                    <span className="text-red-800"> {threat.threatType}</span></div>
                            </Popup>
                        </Marker>
                    ))}
                </MarkerClusterGroup>

            </MapContainer>
        </div>
    );
}