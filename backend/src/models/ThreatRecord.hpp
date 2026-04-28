#pragma once
#include <string>
#include <cstdint>
#include <nlohmann/json.hpp>
#include "GeoLocation.hpp"


class ThreatRecord {
private:
    GeoLocation location;

public:
    uint32_t ipDecimal;
    std::string ipAddress;
    std::string threatType;

    ThreatRecord(uint32_t ipDec, std::string ip, std::string type, GeoLocation loc)
        : ipDecimal(ipDec), ipAddress(ip), threatType(type), location(loc) {
    }

    GeoLocation getGeoLocation() const {
        return location;
    }

    std::string toJSON() const {
        nlohmann::json json;
        json["ip_address"] = ipAddress;
        json["threat_type"] = threatType;
        json["location"]["latitude"] = location.latitude;
        json["location"]["longitude"] = location.longitude;
        json["location"]["country"] = location.country;
        json["location"]["city"] = location.city;

        return json.dump();
    }
};
