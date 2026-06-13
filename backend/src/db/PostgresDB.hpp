#pragma once
#include <string>
#include <vector>
#include "IDataBase.hpp"
#include "models/ThreatRecord.hpp"

class PostgresDB : public IDataBase {
private:
    std::string connectionString;

public:
    PostgresDB(const std::string &connStr);

    ~PostgresDB();

    bool saveBatch(const std::vector<ThreatRecord> &records);

    std::vector<ThreatRecord> getRecords(const std::string &bounds);

    std::string getRecordsAsJson(const std::string &bounds) override;
};
