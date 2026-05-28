import {useEffect, useState, useMemo} from 'react';
import {MapContainer, TileLayer, Marker, Popup, useMap} from 'react-leaflet';
import MarkerClusterGroup from 'react-leaflet-cluster';
import type {LatLngBoundsExpression} from 'leaflet';
import 'leaflet/dist/leaflet.css';
import type {ThreatRecord} from '../../types';
import L from 'leaflet';
import {BoundsFetcher} from "./BoundsFetcher.tsx";

interface ThreatMapProps {
    threats: ThreatRecord[];
    onThreatsUpdate: (threats: ThreatRecord[]) => void;
}

const worldBounds: LatLngBoundsExpression = [
    [-90, -180],
    [90, 180]
];

const createCustomClusterIcon = (cluster: { getChildCount: () => number }) => {
    const count = cluster.getChildCount();
    return L.divIcon({
        html: `
            <div class="flex items-center justify-center w-10 h-10 bg-slate-900 border-2 border-red-500 rounded-full text-red-500 font-bold shadow-[0_0_15px_rgba(239,68,68,0.5)] transition-transform hover:scale-110">
                ${count}
            </div>
        `,
        className: 'bg-transparent',
        iconSize: L.point(40, 40, true),
    });
};

const attackIcon = L.divIcon({
    className: 'bg-transparent',
    html: `<div class="w-4 h-4 bg-red-600 rounded-full border border-red-900 shadow-[0_0_10px_rgba(220,38,38,0.8)]"></div>`,
    iconSize: [16, 16],
    iconAnchor: [8, 8]
});

function LocationFlyer({center}: { center: [number, number] }) {
    const map = useMap();
    useEffect(() => {
        map.flyTo(center, map.getZoom(), {animate: true, duration: 1.5});
    }, [center[0], center[1], map]);
    return null;
}

function MapInvalidator({threats}: { threats: ThreatRecord[] }) {
    const map = useMap();
    useEffect(() => {
        const timeout = setTimeout(() => {
            map.invalidateSize();
        }, 300);
        return () => clearTimeout(timeout);
    }, [map, threats]);
    return null;
}

export function ThreatMap({threats, onThreatsUpdate}: ThreatMapProps) {
    const [currentCenter, setCurrentCenter] = useState<[number, number]>([18.30, -64.83]);
    const [isLocating, setIsLocating] = useState(true);

    useEffect(() => {
        if ("geolocation" in navigator) {
            navigator.geolocation.getCurrentPosition(
                (position) => {
                    setCurrentCenter([position.coords.latitude, position.coords.longitude]);
                    setIsLocating(false);
                },
                (error) => {
                    console.info(error.message);
                    setIsLocating(false);
                },
                {timeout: 5000}
            );
        } else {
            setIsLocating(false);
        }
    }, []);

    const renderedMarkers = useMemo(() => {
        const safeThreats = threats.slice(0, 3000);

        return safeThreats.map((threat, idx) => {
            const threatAny = threat as any;
            const rawIpAddress = threatAny.ipAddress || threatAny.ip_address || "Nieznane IP";
            const rawThreatType = threatAny.threatType || threatAny.threat_type || "Nieznany typ";

            const lat = threat.location?.latitude || 0;
            const lng = threat.location?.longitude || 0;

            const uniqueKey = `marker-${rawIpAddress}-${lat}-${lng}-${idx}`;

            return (
                <Marker
                    key={uniqueKey}
                    position={[lat, lng]}
                    icon={attackIcon}
                >
                    <Popup className="select-none min-w-[200px]">
                        <div className="font-bold text-red-600">Atak z: {rawIpAddress}</div>
                        <div className="text-xs text-gray-800">
                            {threat.location?.city || "Nieznane miasto"}, {threat.location?.country || "Nieznany kraj"}
                        </div>
                        <div className="text-[10px] text-gray-500 mt-1">Typ: {rawThreatType}</div>
                    </Popup>
                </Marker>
            );
        });
    }, [threats]);

    return (
        <div className="relative h-full w-full">
            <div
                className={`absolute inset-0 z-50 bg-slate-950/90 transition-opacity duration-500 ease-in-out flex items-center justify-center pointer-events-none 
                    ${isLocating ? 'opacity-100' : 'opacity-0'}`}
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
                zoomAnimation={false}
            >
                <MapInvalidator threats={threats}/>
                <LocationFlyer center={currentCenter}/>
                <BoundsFetcher onThreatsFetched={onThreatsUpdate}/>

                <TileLayer
                    url="https://tiles.stadiamaps.com/tiles/stamen_toner_dark/{z}/{x}/{y}{r}.png"
                    keepBuffer={4}
                    updateWhenIdle={false}
                />

                <MarkerClusterGroup
                    chunkedLoading={true}
                    iconCreateFunction={createCustomClusterIcon}
                    maxClusterRadius={80}
                    spiderfyOnMaxZoom={true}
                    showCoverageOnHover={false}
                >
                    {renderedMarkers}
                </MarkerClusterGroup>
            </MapContainer>
        </div>
    );
}