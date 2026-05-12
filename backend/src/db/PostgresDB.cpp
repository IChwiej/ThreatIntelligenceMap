#include "PostgresDB.hpp"
#include <pqxx/pqxx>
#include <iostream>

PostgresDB::PostgresDB(const std::string &connStr) : connectionString(connStr) {
}

PostgresDB::~PostgresDB() {
}

bool PostgresDB::saveBatch(const std::vector<ThreatRecord> &records) {
    try {
        pqxx::connection c(connectionString);

        pqxx::work w(c);

        for (auto const &record: records) {
            GeoLocation loc = record.getGeoLocation();
            w.exec_params(
                "INSERT INTO threat_records "
                "(ip_address, ip_decimal, threat_type, country, city, latitude, longitude, geom) "
                "VALUES ($1, $2, $3, $4, $5, $6, $7, ST_SetSRID(ST_MakePoint($8, $9), 4326))",
                record.ipAddress,
                record.ipDecimal,
                record.threatType,
                loc.country,
                loc.city,
                loc.latitude,
                loc.longitude,
                loc.longitude,
                loc.latitude
            );
        }

        w.commit();
        return true;
    } catch (const std::exception &e) {
        std::cerr << "Database write error: " << e.what() << std::endl;
        return false;
    }
}

std::vector<ThreatRecord> PostgresDB::getRecords(const std::string &bounds) {
    std::vector<ThreatRecord> result;

    double minLon = 0.0, minLat = 0.0, maxLon = 0.0, maxLat = 0.0;
    char comma;

    std::stringstream ss(bounds);
    ss >> minLon >> comma >> minLat >> comma >> maxLon >> comma >> maxLat;

    try {
        pqxx::connection c(connectionString);

        pqxx::nontransaction w(c);

        pqxx::result r = w.exec_params(
            "SELECT ip_address, ip_decimal, threat_type, country, city, latitude, longitude "
            "FROM threat_records "
            "WHERE geom && ST_MakeEnvelope($1, $2, $3, $4, 4326)",
            minLon, minLat, maxLon, maxLat
        );

        for (auto const &row: r) {
            GeoLocation location;

            if (!row["country"].is_null()) location.country = row["country"].as<std::string>();
            if (!row["city"].is_null()) location.city = row["city"].as<std::string>();
            if (!row["latitude"].is_null()) location.latitude = row["latitude"].as<double>();
            if (!row["longitude"].is_null()) location.longitude = row["longitude"].as<double>();

            ThreatRecord record(
                row["ip_decimal"].as<uint32_t>(),
                row["ip_address"].as<std::string>(),
                row["threat_type"].as<std::string>(),
                location
            );

            result.push_back(record);
        }
    } catch (const std::exception &e) {
        std::cerr << "Error retrieving data from PostGIS: " << e.what() << std::endl;
    }

    return result;
}
