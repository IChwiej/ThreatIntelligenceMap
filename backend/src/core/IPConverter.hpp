#pragma once
#include <string>
#include <cstdint>

class IPConverter {
public:
    static
    uint32_t toDecimal(const std::string &ip);
    std::string fromDecimal(uint32_t dec);
};
