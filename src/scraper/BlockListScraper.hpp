#pragma once
#include "IDataSource.hpp"
#include <string>

class BlocklistScraper : public IDataSource {
private:
    std::string sourceUrl;

public:
    BlocklistScraper(const std::string &url);

    std::string fetchRawData() override;
};
