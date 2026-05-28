#pragma once
#include "IDataSource.hpp"
#include <string>

class BlocklistScraper : public IDataSource {
private:
    std::string host;
    std::string path;

public:
    BlocklistScraper() = default;

    BlocklistScraper(const std::string &targetHost, const std::string &targetPath);

    void setTarget(const std::string &newHost, const std::string &newPath) override;

    std::string fetchRawData() override;
};
