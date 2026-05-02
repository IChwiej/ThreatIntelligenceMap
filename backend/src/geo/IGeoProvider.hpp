#pragma once
#include "../models/GeoLocation.hpp"
#include <cstdint>

class IGeoProvider {
public:
    virtual ~IGeoProvider() = default;

    virtual GeoLocation getLocation(uint32_t ipDec) = 0;
};
