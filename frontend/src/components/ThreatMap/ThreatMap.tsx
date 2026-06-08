import {useState, useEffect, useCallback, useRef, useMemo} from 'react';
import DeckGL from '@deck.gl/react';
import {ScatterplotLayer, TextLayer} from '@deck.gl/layers';
import {MapView, WebMercatorViewport} from '@deck.gl/core';
import type {MapViewState, PickingInfo} from '@deck.gl/core';
import MapGl from 'react-map-gl/maplibre';
import 'maplibre-gl/dist/maplibre-gl.css';
import type {ThreatRecord} from '../../types';


interface SCClusterProperties {
    cluster: true;
    cluster_id: number;
    point_count: number;
    point_count_abbreviated: string | number;
}

interface SCPointFeature<P> {
    type: 'Feature';
    geometry: { type: 'Point'; coordinates: number[] };
    properties: P;
}

type SCClusterFeature = SCPointFeature<SCClusterProperties>;
type SCRawPoint = SCPointFeature<{ threat: ThreatRecord }>;
type SCItem = SCClusterFeature | SCRawPoint;


interface ThreatMapProps {
    threats: ThreatRecord[];
    onThreatsUpdate: (threats: ThreatRecord[]) => void;
}

interface ClusterDot {
    position: [number, number];
    count: number;
    isCluster: boolean;
    clusterId?: number;
    threat?: ThreatRecord;
}

interface StackPopup {
    screenX: number;
    screenY: number;
    threats: ThreatRecord[];
}


const mapStyle = {
    version: 8 as const,
    sources: {
        'stadia-dark': {
            type: 'raster' as const,
            tiles: ['https://tiles.stadiamaps.com/tiles/stamen_toner_dark/{z}/{x}/{y}.png'],
            tileSize: 256,
        },
    },
    layers: [{
        id: 'stadia-dark-layer',
        type: 'raster' as const,
        source: 'stadia-dark',
        minzoom: 0,
        maxzoom: 20,
    }],
};

const MAP_VIEW = new MapView({id: 'main', repeat: false});
const MAX_BOUNDS: [[number, number], [number, number]] = [[-180, -85.051129], [180, 85.051129]];
const MIN_ZOOM = 1.5;
const MAX_ZOOM = 18;

const INITIAL_VIEW_STATE: MapViewState & { minZoom: number; maxZoom: number } = {
    longitude: 10, latitude: 20, zoom: MIN_ZOOM,
    minZoom: MIN_ZOOM, maxZoom: MAX_ZOOM,
    pitch: 0, bearing: 0,
};


function normaliseLon(lon: number): number {
    return ((((lon + 180) % 360) + 360) % 360) - 180;
}

function clusterColour(count: number): [number, number, number, number] {
    const t = Math.min(1, Math.log10(Math.max(1, count)) / 3);
    return [220, Math.round(38 + 179 * t), Math.round(38 + 34 * t), 210];
}

function clusterRadius(count: number): number {
    if (count === 1) return 6;
    if (count < 10) return 12;
    if (count < 100) return 18;
    if (count < 1000) return 24;
    return 30;
}

function coordKey(lon: number, lat: number): string {
    return `${lon.toFixed(4)},${lat.toFixed(4)}`;
}

function getThreatFields(t: ThreatRecord) {
    return {
        ip: (t as ThreatRecord & { ip_address?: string }).ip_address ?? t.ipAddress ?? 'Nieznane IP',
        threat: (t as ThreatRecord & { threat_type?: string }).threat_type ?? t.threatType ?? 'Nieznany typ',
        city: t.location?.city ?? 'Nieznane miasto',
        country: t.location?.country ?? 'Nieznany kraj',
    };
}

const tooltipStyle = {
    backgroundColor: '#0f172a', border: '1px solid #334155',
    borderRadius: '6px', padding: '10px', color: 'white',
    fontFamily: 'inherit', boxShadow: '0 4px 6px -1px rgba(0,0,0,0.5)',
};


const fetchCache = new Map<string, ThreatRecord[]>();

function roundedBoundsKey(w: number, s: number, e: number, n: number): string {
    return [w, s, e, n].map(v => Math.round(v * 100) / 100).join(',');
}

function createWorker(): Worker {
    const src = `
importScripts('https://cdn.jsdelivr.net/npm/supercluster@8/dist/supercluster.min.js');
var sc = null;
function normLon(lon) { return ((((lon+180)%360)+360)%360)-180; }
self.onmessage = function(e) {
    var type = e.data.type, payload = e.data.payload;
    if (type === 'load') {
        sc = new self.Supercluster({ radius: 60, maxZoom: 16, minPoints: 3 });
        sc.load(payload.threats.map(function(t) {
            var lon = t.location && t.location.longitude != null ? t.location.longitude : 0;
            var lat = t.location && t.location.latitude  != null ? t.location.latitude  : 0;
            return { type:'Feature', geometry:{ type:'Point', coordinates:[normLon(lon), Math.min(85.05,Math.max(-85.05,lat))] }, properties:{ threat:t } };
        }));
        self.postMessage({ type:'loaded' });
        return;
    }
    if (type === 'getClusters') {
        self.postMessage({ type:'clusters', payload: sc ? sc.getClusters([-180,-85.05,180,85.05], payload.zoom) : [] });
        return;
    }
    if (type === 'getExpansionZoom') {
        self.postMessage({ type:'expansionZoom', payload: sc ? sc.getClusterExpansionZoom(payload.clusterId) : 0 });
        return;
    }
};`;
    return new Worker(URL.createObjectURL(new Blob([src], {type: 'application/javascript'})));
}


export function ThreatMap({threats, onThreatsUpdate}: ThreatMapProps) {
    const [viewState, setViewState] = useState(INITIAL_VIEW_STATE);
    const [isLocating, setIsLocating] = useState(true);
    const [clusterMode, setClusterMode] = useState(false);

    const [clusterDots, setClusterDots] = useState<ClusterDot[]>([]);
    const [clusterReady, setClusterReady] = useState(false);
    const [stackPopup, setStackPopup] = useState<StackPopup | null>(null);

    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const workerRef = useRef<Worker | null>(null);

    const pendingZoom = useRef<number | null>(null);

    const clusterModeRef = useRef(false);

    const stackMap = useMemo(() => {
        const m = new Map<string, ThreatRecord[]>();
        for (const t of threats) {
            const lon = normaliseLon(t.location?.longitude ?? 0);
            const lat = t.location?.latitude ?? 0;
            const key = coordKey(lon, lat);
            const arr = m.get(key);
            if (arr) arr.push(t); else m.set(key, [t]);
        }
        return m;
    }, [threats]);

    useEffect(() => {
        const w = createWorker();
        workerRef.current = w;

        w.onmessage = (e: MessageEvent<{ type: string; payload: unknown }>) => {
            const {type, payload} = e.data;

            if (type === 'loaded') {
                const zoom = Math.floor(pendingZoom.current ?? 2);
                pendingZoom.current = null;
                if (clusterModeRef.current) {

                    w.postMessage({type: 'getClusters', payload: {zoom}});
                } else {
                    setClusterReady(true);
                }
                return;
            }

            if (type === 'clusters') {
                const items = payload as SCItem[];
                const dots: ClusterDot[] = items.map(item => {
                    const [lng, lat] = item.geometry.coordinates;
                    const p = item.properties as SCClusterProperties;
                    if (p.cluster) {
                        return {
                            position: [lng, lat] as [number, number],
                            count: p.point_count,
                            isCluster: true,
                            clusterId: p.cluster_id
                        };
                    }
                    return {
                        position: [lng, lat] as [number, number],
                        count: 1,
                        isCluster: false,
                        threat: (item as SCRawPoint).properties.threat
                    };
                });
                setClusterDots(dots);
                setClusterReady(true);
                return;
            }

            if (type === 'expansionZoom') {

            }
        };

        return () => w.terminate();
    }, []);


    useEffect(() => {
        if (!threats.length || !workerRef.current) return;

        setClusterReady(false);
        const zoom = Math.floor(viewState.zoom);
        pendingZoom.current = zoom;
        workerRef.current.postMessage({type: 'load', payload: {threats}});

    }, [threats]);


    useEffect(() => {
        if (!clusterMode || !clusterReady || !workerRef.current) return;
        const zoom = Math.floor(viewState.zoom);
        workerRef.current.postMessage({type: 'getClusters', payload: {zoom}});

    }, [viewState.zoom]);


    useEffect(() => {
        clusterModeRef.current = clusterMode;
        setStackPopup(null);

        if (!clusterMode) return;

        if (clusterReady && workerRef.current) {
            const zoom = Math.floor(viewState.zoom);
            workerRef.current.postMessage({type: 'getClusters', payload: {zoom}});
        } else {

            pendingZoom.current = Math.floor(viewState.zoom);
        }

    }, [clusterMode]);


    useEffect(() => {
        if ('geolocation' in navigator) {
            navigator.geolocation.getCurrentPosition(
                pos => {
                    setViewState(prev => ({
                        ...prev,
                        longitude: pos.coords.longitude,
                        latitude: pos.coords.latitude,
                        zoom: 4,
                        transitionDuration: 1500,
                    }));
                    setIsLocating(false);
                },
                err => {
                    console.info(err.message);
                    setIsLocating(false);
                },
                {timeout: 5000},
            );
        } else {
            setIsLocating(false);
        }
        return () => {
            if (timeoutRef.current) clearTimeout(timeoutRef.current);
        };
    }, []);


    const fetchThreats = useCallback(async (vs: MapViewState) => {
        if (vs.longitude == null || vs.latitude == null) return;
        try {
            const vp = new WebMercatorViewport({...vs, width: window.innerWidth, height: window.innerHeight});
            const b = vp.getBounds();
            const bw = b[2] - b[0], bh = b[3] - b[1];
            const west = Math.max(-180, b[0] - bw * 0.5);
            const south = Math.max(-90, b[1] - bh * 0.5);
            const east = Math.min(180, b[2] + bw * 0.5);
            const north = Math.min(90, b[3] + bh * 0.5);

            const key = roundedBoundsKey(west, south, east, north);
            if (fetchCache.has(key)) {
                onThreatsUpdate(fetchCache.get(key)!);
                return;
            }

            const res = await fetch(`http://localhost:8080/api/threats?bounds=${west},${south},${east},${north}`);
            if (res.ok) {
                const data = await res.json() as ThreatRecord[];
                fetchCache.set(key, data);
                if (fetchCache.size > 20) fetchCache.delete(fetchCache.keys().next().value!);
                onThreatsUpdate(data);
            }
        } catch (err) {
            console.error('Błąd podczas pobierania ataków:', err);
        }
    }, [onThreatsUpdate]);


    useEffect(() => {
        void fetchThreats(viewState);
    }, []);

    const onViewStateChange = useCallback(({viewState: vs}: { viewState: MapViewState }) => {
        setViewState(prev => ({...vs, minZoom: prev.minZoom, maxZoom: prev.maxZoom}));
        setStackPopup(null);
        if (timeoutRef.current) clearTimeout(timeoutRef.current);
        timeoutRef.current = setTimeout(() => void fetchThreats(vs), 500);
    }, [fetchThreats]);


    const onClusterClick = useCallback(({object, x, y}: PickingInfo<ClusterDot>) => {
        if (!object) return;

        if (object.isCluster && object.clusterId != null && workerRef.current) {
            const w = workerRef.current;
            const origHandler = w.onmessage;
            w.onmessage = (e: MessageEvent<{ type: string; payload: number }>) => {
                if (e.data.type === 'expansionZoom') {
                    w.onmessage = origHandler;
                    const zoom = Math.min(e.data.payload, MAX_ZOOM);
                    setViewState(s => ({
                        ...s,
                        longitude: object.position[0],
                        latitude: object.position[1],
                        zoom,
                        transitionDuration: 400
                    }));
                } else {
                    origHandler?.call(w, e as MessageEvent);
                }
            };
            w.postMessage({type: 'getExpansionZoom', payload: {clusterId: object.clusterId}});
            return;
        }


        if (!object.isCluster && object.threat) {
            const lon = normaliseLon(object.threat.location?.longitude ?? 0);
            const lat = object.threat.location?.latitude ?? 0;
            const stack = stackMap.get(coordKey(lon, lat)) ?? [object.threat];
            if (stack.length > 1) {
                setStackPopup({screenX: x ?? 0, screenY: y ?? 0, threats: stack});
            }
        }
    }, [stackMap]);


    const onRawClick = useCallback(({object, x, y}: PickingInfo<ThreatRecord>) => {
        if (!object) return;
        const lon = normaliseLon(object.location?.longitude ?? 0);
        const lat = object.location?.latitude ?? 0;
        const stack = stackMap.get(coordKey(lon, lat)) ?? [object];
        if (stack.length > 1) {
            setStackPopup({screenX: x ?? 0, screenY: y ?? 0, threats: stack});
        }
    }, [stackMap]);


    const getTooltip = useCallback(({object}: PickingInfo<ClusterDot | ThreatRecord>) => {
        if (!object) return null;

        if ('isCluster' in object) {
            if (object.isCluster) {
                return {
                    html: `<div style="font-weight:bold;color:#ef4444;margin-bottom:4px;">Klaster: ${object.count} ataków</div><div style="font-size:10px;color:#6b7280;">Kliknij aby przybliżyć</div>`,
                    style: tooltipStyle,
                };
            }
            if (object.threat) {
                const t = object.threat;
                const {ip, threat, city, country} = getThreatFields(t);
                const lon = normaliseLon(t.location?.longitude ?? 0);
                const stack = stackMap.get(coordKey(lon, t.location?.latitude ?? 0))?.length ?? 1;
                const hint = stack > 1 ? `<div style="font-size:10px;color:#f59e0b;margin-top:4px;">+${stack - 1} innych ataków — kliknij</div>` : '';
                return {
                    html: `<div style="font-weight:bold;color:#ef4444;margin-bottom:4px;">Atak z: ${ip}</div><div style="font-size:12px;color:#9ca3af;">${city}, ${country}</div><div style="font-size:10px;color:#6b7280;margin-top:6px;">Typ: ${threat}</div>${hint}`,
                    style: tooltipStyle
                };
            }
        }

        const t = object as ThreatRecord;
        const {ip, threat, city, country} = getThreatFields(t);
        const lon = normaliseLon(t.location?.longitude ?? 0);
        const stack = stackMap.get(coordKey(lon, t.location?.latitude ?? 0))?.length ?? 1;
        const hint = stack > 1 ? `<div style="font-size:10px;color:#f59e0b;margin-top:4px;">+${stack - 1} innych ataków — kliknij</div>` : '';
        return {
            html: `<div style="font-weight:bold;color:#ef4444;margin-bottom:4px;">Atak z: ${ip}</div><div style="font-size:12px;color:#9ca3af;">${city}, ${country}</div><div style="font-size:10px;color:#6b7280;margin-top:6px;">Typ: ${threat}</div>${hint}`,
            style: tooltipStyle
        };
    }, [stackMap]);


    const layers = useMemo(() => {
        if (clusterMode && clusterDots.length > 0) {
            return [
                new ScatterplotLayer<ClusterDot>({
                    id: 'cluster-circles',
                    data: clusterDots,
                    getPosition: d => d.position,
                    getFillColor: d => clusterColour(d.count),
                    getLineColor: [80, 10, 10, 255],
                    getLineWidth: 1,
                    lineWidthUnits: 'pixels',
                    getRadius: d => clusterRadius(d.count),
                    radiusUnits: 'pixels',
                    stroked: true, filled: true, pickable: true,
                    onClick: onClusterClick,
                    updateTriggers: {getRadius: clusterDots, getFillColor: clusterDots},
                }),
                new TextLayer<ClusterDot>({
                    id: 'cluster-labels',
                    data: clusterDots.filter(d => d.count > 1),
                    getPosition: d => d.position,
                    getText: d => d.count >= 1000 ? `${(d.count / 1000).toFixed(1)}k` : String(d.count),
                    getSize: 11,
                    getColor: [255, 255, 255, 240],
                    fontWeight: 'bold',
                    fontFamily: 'monospace',
                    getTextAnchor: 'middle',
                    getAlignmentBaseline: 'center',
                    pickable: false,
                    updateTriggers: {getText: clusterDots},
                }),
            ];
        }

        return [
            new ScatterplotLayer<ThreatRecord>({
                id: 'threats-layer',
                data: threats,
                getPosition: d => [normaliseLon(d.location?.longitude ?? 0), d.location?.latitude ?? 0],
                getFillColor: [220, 38, 38, 180],
                getLineColor: [127, 29, 29, 255],
                getLineWidth: 1,
                lineWidthUnits: 'pixels',
                getRadius: 6,
                radiusUnits: 'pixels',
                stroked: true, filled: true, pickable: true,
                onClick: onRawClick,
                updateTriggers: {getPosition: threats},
            }),
        ];
    }, [clusterMode, clusterDots, threats, onClusterClick, onRawClick]);


    return (
        <div className="relative h-full w-full" style={{position: 'relative'}}>
            <div
                className={`absolute inset-0 z-50 bg-slate-950/90 transition-opacity duration-500 ease-in-out flex items-center justify-center pointer-events-none ${isLocating ? 'opacity-100' : 'opacity-0'}`}>
                <div className="text-xl text-red-500 font-semibold">Pobieranie Twojej lokalizacji...</div>
            </div>

            <button
                onClick={() => setClusterMode(v => !v)}
                className={`absolute top-4 right-4 z-40 flex items-center gap-2 px-4 py-2 rounded-lg border text-sm font-semibold transition-all duration-200 select-none ${
                    clusterMode
                        ? 'bg-red-600 border-red-500 text-white shadow-lg shadow-red-900/40'
                        : 'bg-slate-900/90 border-slate-700 text-slate-300 hover:border-red-600 hover:text-red-400'
                }`}
            >
                <span
                    className={`inline-block w-2 h-2 rounded-full transition-colors duration-200 ${clusterMode ? 'bg-white' : 'bg-slate-500'}`}/>
                Grupowanie
            </button>

            {stackPopup && (
                <StackPopupPanel popup={stackPopup} onClose={() => setStackPopup(null)}/>
            )}

            <DeckGL
                views={MAP_VIEW}
                viewState={viewState}
                onViewStateChange={onViewStateChange}
                controller={{
                    maxBounds: MAX_BOUNDS,
                    dragPan: true,
                    dragRotate: false,
                    scrollZoom: true,
                    touchZoom: true,
                    touchRotate: false,
                    keyboard: true,
                    doubleClickZoom: true
                }}
                layers={layers}
                getTooltip={getTooltip}
                style={{width: '100%', height: '100%'}}
            >
                <MapGl mapStyle={mapStyle} reuseMaps/>
            </DeckGL>
        </div>
    );
}


const THREAT_COLOURS: Record<string, string> = {
    SSH_BRUTEFORCE: '#ef4444',
    PORT_SCAN: '#f97316',
    SPAM: '#eab308',
    MALWARE: '#a855f7',
    DDOS: '#3b82f6',
};

function badgeColour(type: string): string {
    return THREAT_COLOURS[type] ?? '#6b7280';
}

interface StackPopupPanelProps {
    popup: StackPopup;
    onClose: () => void;
}

function StackPopupPanel({popup, onClose}: StackPopupPanelProps) {
    const POPUP_W = 320;
    const POPUP_H = 400;
    const GAP = 12;

    const left = Math.min(popup.screenX + GAP, window.innerWidth - POPUP_W - GAP);
    const top = Math.min(popup.screenY + GAP, window.innerHeight - POPUP_H - GAP);

    const {city, country} = getThreatFields(popup.threats[0]);

    return (
        <div
            className="absolute z-40 rounded-xl border border-slate-700 shadow-2xl overflow-hidden flex flex-col"
            style={{left, top, width: POPUP_W, maxHeight: POPUP_H, background: '#0f172a'}}
            onClick={e => e.stopPropagation()}
        >
            <div className="flex items-center justify-between px-4 py-3 border-b border-slate-700"
                 style={{background: '#1e293b'}}>
                <div>
                    <div className="text-white font-semibold text-sm">{city}, {country}</div>
                    <div className="text-slate-400 text-xs mt-0.5">{popup.threats.length} ataków w tej lokalizacji</div>
                </div>
                <button
                    onClick={onClose}
                    className="text-slate-500 hover:text-white transition-colors text-lg leading-none ml-3 shrink-0"
                    aria-label="Zamknij"
                >
                    ✕
                </button>
            </div>

            <div className="overflow-y-auto flex-1"
                 style={{scrollbarWidth: 'thin', scrollbarColor: '#334155 transparent'}}>
                {popup.threats.map((t, i) => {
                    const {ip, threat} = getThreatFields(t);
                    const colour = badgeColour(threat);
                    return (
                        <div key={i}
                             className="px-4 py-3 border-b border-slate-800 last:border-0 hover:bg-slate-800/50 transition-colors">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-sm font-mono text-slate-200 truncate">{ip}</span>
                                <span
                                    className="text-xs font-semibold px-2 py-0.5 rounded shrink-0"
                                    style={{background: `${colour}22`, color: colour, border: `1px solid ${colour}55`}}
                                >
                                    {threat}
                                </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </div>
    );
}