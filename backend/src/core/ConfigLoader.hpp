#pragma once
#include <string>
#include <vector>

struct ScraperConfig {
    std::string host;
    std::string path;
    std::string threatType;
};

class ConfigLoader {
public:
    static std::vector<ScraperConfig> loadConfig(const std::string &filePath);
};
