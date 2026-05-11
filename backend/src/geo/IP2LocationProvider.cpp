#include "IP2LocationProvider.hpp"
#include <stdexcept>
#include "../core/IPConverter.hpp"

IP2LocationProvider::IP2LocationProvider(const std::string &path)
    : dbFilePath(path), dbObj(nullptr) {
    dbObj = IP2Location_open(const_cast<char *>(dbFilePath.c_str()));

    if (dbObj == nullptr) {
        throw std::runtime_error("Error, couldn't open data base on path: " + dbFilePath);
    }

    IP2Location_open_mem(dbObj, IP2LOCATION_SHARED_MEMORY);
}

IP2LocationProvider::~IP2LocationProvider() {
    if (dbObj != nullptr) {
        IP2Location_close(dbObj);
        dbObj = nullptr;
    }
}

GeoLocation IP2LocationProvider::getLocation(uint32_t ipDec) {
    GeoLocation location{0.0, 0.0, "Uknown", "Unknown"};

    if (dbObj == nullptr) {
        return location;
    }

    std::string ipStr = IPConverter::fromDecimal(ipDec);

    IP2LocationRecord *record = IP2Location_get_all(dbObj, const_cast<char *>(ipStr.c_str()));

    if (record != nullptr) {
        location.country = (record->country_long != nullptr) ? std::string(record->country_long) : "Unknown";
        location.city = (record->city != nullptr) ? std::string(record->city) : "Unknown";
        location.latitude = record->latitude;
        location.longitude = record->longitude;

        IP2Location_free_record(record);
    }

    return location;
}
