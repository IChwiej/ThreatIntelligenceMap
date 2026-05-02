#include "IPConverter.hpp"
#include <string>
#include <sstream>
#include <iostream>
#include <cmath>


uint32_t IPConverter::toDecimal(const std::string &ip) {
    std::stringstream separator(ip);
    std::uint32_t decimal = 0;
    std::string octet_str;

    int i = 3;
    while (i >= 0 && std::getline(separator, octet_str, '.')) {
        uint32_t octet_val = std::stoi(octet_str);
        decimal += (octet_val * pow(256, i));
        i--;
    }
    return decimal;
}

std::string IPConverter::fromDecimal(uint32_t dec) {
    int ip_address[4];
    for (int i = 3; i >= 0; i--) {
        int octet = dec % 256;
        ip_address[i] = octet;
        dec /= 256;
    }
    std::string ip = std::to_string(ip_address[0]) + "." +
                     std::to_string(ip_address[1]) + "." +
                     std::to_string(ip_address[2]) + "." +
                     std::to_string(ip_address[3]);
    return ip;
}
