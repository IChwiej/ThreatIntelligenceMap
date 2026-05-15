#pragma once
#include <string>

class IDataSource {
public:
    virtual ~IDataSource() = default;

    virtual void setTarget(const std::string &newHost, const std::string &newPath) = 0;

    virtual std::string fetchRawData() = 0;
};
