#pragma once
#include <string>
#include <vector>
#include "models/ThreatRecord.hpp"

class PostgresDB {
private:
    std::string connectionString;

public:
    PostgresDB(const std::string &connStr);

    ~PostgresDB();

    bool saveBatch(const std::vector<ThreatRecord> &records);

    std::vector<ThreatRecord> getRecords(const std::string &bounds);
};
