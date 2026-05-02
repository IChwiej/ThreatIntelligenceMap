#pragma once
#include <string>
#include "IGeoProvider.hpp"
#include "../models/GeoLocation.hpp"
#include "IP2Location.h"

class IP2LocationProvider : public IGeoProvider {
private:
    std::string dbFilePath;
    IP2Location *dbObj;

public:
    IP2LocationProvider(const std::string &path);

    ~IP2LocationProvider();

    GeoLocation getLocation(uint32_t ipDec) override;
};
