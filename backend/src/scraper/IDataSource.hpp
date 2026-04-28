#pragma once
#include <string>

class IDataSource {
public:
    virtual ~IDataSource() = default;

    virtual std::string fetchRawData() = 0;
};
