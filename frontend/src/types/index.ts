export interface GeoLocation {
    latitude: number;
    longitude: number;
    country: string;
    city: string;
}

export interface ThreatRecord {
    ipDecimal: number;
    ipAddress: string;
    threatType: string;
    location: GeoLocation;
}