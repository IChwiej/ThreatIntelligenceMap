import type {ThreatRecord} from "../types";

export const mockThreats: ThreatRecord[] = [
    {
        ipDecimal: 1717986918,
        ipAddress: "102.102.102.102",
        threatType: "bot",
        location: {latitude: 55.7558, longitude: 37.6173, country: "Russia", city: "Moscow"}
    },
    {
        ipDecimal: 3232235778,
        ipAddress: "192.168.1.2",
        threatType: "malware",
        location: {latitude: 39.9042, longitude: 116.4074, country: "China", city: "Beijing"}
    },
    {
        ipDecimal: 893456123,
        ipAddress: "45.22.19.100",
        threatType: "ddos",
        location: {latitude: 40.7128, longitude: -74.0060, country: "USA", city: "New York"}
    },
    {
        ipDecimal: 3401229011,
        ipAddress: "203.0.113.50",
        threatType: "spam",
        location: {latitude: -23.5505, longitude: -46.6333, country: "Brazil", city: "Sao Paulo"}
    },
    {
        ipDecimal: 1745920001,
        ipAddress: "104.18.32.1",
        threatType: "phishing",
        location: {latitude: 51.5074, longitude: -0.1278, country: "UK", city: "London"}
    },
    {
        ipDecimal: 3698124444,
        ipAddress: "220.10.15.9",
        threatType: "malware",
        location: {latitude: -33.8688, longitude: 151.2093, country: "Australia", city: "Sydney"}
    },
    {
        ipDecimal: 689012341,
        ipAddress: "41.10.20.30",
        threatType: "bot",
        location: {latitude: -33.9249, longitude: 18.4241, country: "South Africa", city: "Cape Town"}
    },
    {
        ipDecimal: 1499201928,
        ipAddress: "89.64.12.3",
        threatType: "ddos",
        location: {latitude: 52.2297, longitude: 21.0122, country: "Poland", city: "Warsaw"}
    },
    {
        ipDecimal: 2360192833,
        ipAddress: "14.10.55.66",
        threatType: "malware",
        location: {latitude: 19.0760, longitude: 72.8777, country: "India", city: "Mumbai"}
    },
    {
        ipDecimal: 1092837465,
        ipAddress: "65.99.12.1",
        threatType: "phishing",
        location: {latitude: 35.6762, longitude: 139.6503, country: "Japan", city: "Tokyo"}
    }
];