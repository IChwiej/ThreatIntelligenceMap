#include "DataPipeline.hpp"
#include "../db/IDataBase.hpp"
#include "../geo/IGeoProvider.hpp"
#include "../scraper/IDataSource.hpp"
#include "../core/IPConverter.hpp"
#include "../core/ConfigLoader.hpp"
#include <vector>
#include <string>
#include <sstream>
#include <iostream>


DataPipeline::DataPipeline(IDataSource *src, IGeoProvider *geo, IDataBase *database) : source(src), geoProvider(geo),
    db(database) {
}

void DataPipeline::run(const std::vector<ScraperConfig> &configs) {
    std::vector<ThreatRecord> batchToSave;
    for (const auto &config: configs) {
        source->setTarget(config.host, config.path);

        std::string data = source->fetchRawData();
        std::istringstream stream(data);
        std::string ip_address;

        while (getline(stream, ip_address)) {
            if (!ip_address.empty()) {
                if (ip_address.find(":") != std::string::npos) {
                    continue;
                }
                std::uint32_t ip_dec = IPConverter::toDecimal(ip_address);
                GeoLocation location = geoProvider->getLocation(ip_dec);
                ThreatRecord record(ip_dec, ip_address, config.threatType, location);
                batchToSave.push_back(record);
            }
        }
    }
    if (!batchToSave.empty()) {
        db->saveBatch(batchToSave);
    }
}

