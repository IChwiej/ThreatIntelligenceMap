#pragma once
#include <vector>
#include "ConfigLoader.hpp"

class IDataSource;
class IGeoProvider;
class IDataBase;

class DataPipeline {
private:
    IDataSource *source;
    IGeoProvider *geoProvider;
    IDataBase *db;

public:
    DataPipeline(IDataSource *src, IGeoProvider *geo, IDataBase *database);

    void run(const std::vector<ScraperConfig> &configs);
};
