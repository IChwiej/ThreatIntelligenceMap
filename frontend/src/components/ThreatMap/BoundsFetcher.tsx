import {useEffect, useRef} from 'react';
import {useMapEvents} from 'react-leaflet';
import type {ThreatRecord} from '../../types';

interface BoundsFetcherProps {
    onThreatsFetched: (threats: ThreatRecord[]) => void;
}

export function BoundsFetcher({onThreatsFetched}: BoundsFetcherProps) {
    const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    const map = useMapEvents({
        moveend: () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }

            timeoutRef.current = setTimeout(() => {
                fetchDataForCurrentBounds();
            }, 500);
        }
    });

    const fetchDataForCurrentBounds = async () => {
        const bounds = map.getBounds();
        const south = bounds.getSouth();
        const west = bounds.getWest();
        const north = bounds.getNorth();
        const east = bounds.getEast();

        const boundsParam = `${west},${south},${east},${north}`;

        try {
            const response = await fetch(`http://localhost:8080/api/threats?bounds=${boundsParam}`);
            if (response.ok) {
                const data = await response.json();
                onThreatsFetched(data);
            }
        } catch (error) {
            console.error(error);
        }
    };

    useEffect(() => {
        fetchDataForCurrentBounds();

        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
        };
    }, []);

    return null;
}