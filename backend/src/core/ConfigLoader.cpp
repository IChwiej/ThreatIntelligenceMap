#include "ConfigLoader.hpp"
#include <fstream>
#include <iostream>
#include <nlohmann/json.hpp>

using json = nlohmann::json;

std::vector<ScraperConfig> ConfigLoader::loadConfig(const std::string &filePath) {
    std::vector<ScraperConfig> configs;

    std::ifstream file(filePath);
    if (!file.is_open()) {
        std::cerr << "Cannot open config file: " << filePath << std::endl;
        return configs;
    }

    json json;
    file >> json;

    for (const auto &item: json["sources"]) {
        ScraperConfig cfg;
        cfg.host = item["host"];
        cfg.path = item["path"];
        cfg.threatType = item["threatType"];

        configs.push_back(cfg);
    }

    return configs;
}
