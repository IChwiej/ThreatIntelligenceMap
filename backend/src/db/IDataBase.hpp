#pragma once
#include <string>
#include <vector>
#include "../models/ThreatRecord.hpp"


class IDataBase {
public:
    virtual ~IDataBase() = default;

    virtual bool saveBatch(const std::vector<ThreatRecord> &records) = 0;

    virtual std::vector<ThreatRecord> getRecords(const std::string &bounds) = 0;

    virtual std::string getRecordsAsJson(const std::string &bounds) = 0;
};
