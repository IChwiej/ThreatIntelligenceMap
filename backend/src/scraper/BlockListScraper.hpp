#pragma once
#include "IDataSource.hpp"
#include <string>

class BlocklistScraper : public IDataSource {
private:
    std::string host;
    std::string path;

public:
    BlocklistScraper(const std::string &targetHost, const std::string &targetPath);

    std::string fetchRawData() override;
};
