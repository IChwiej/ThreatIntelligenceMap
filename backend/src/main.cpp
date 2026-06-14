#include <iostream>
#include <vector>
#include <exception>
#include <cstdlib>
#include "core/ConfigLoader.hpp"
#include "core/DataPipeline.hpp"
#include "core/UpdateManager.hpp"
#include "scraper/BlockListScraper.hpp"
#include "geo/IP2LocationProvider.hpp"
#include "db/PostgresDB.hpp"
#include "api/ApiServer.hpp"

int main() {
    try {
        std::cout << "Start\n";

        std::string configPath = "data/config.json";
        std::cout << "Loading config: " << configPath << "\n";
        std::vector<ScraperConfig> configs = ConfigLoader::loadConfig(configPath);

        std::cout << "Initializing Database\n";
        std::string dbHost = getenv("DB_HOST") ? getenv("DB_HOST") : "db";
        std::string dbName = getenv("DB_NAME") ? getenv("DB_NAME") : "threat_db";
        std::string dbUser = getenv("DB_USER") ? getenv("DB_USER") : "admin";
        std::string dbPassword = getenv("DB_PASSWORD") ? getenv("DB_PASSWORD") : "admin";
        std::string dbPort = getenv("DB_PORT") ? getenv("DB_PORT") : "5432";

        std::string connStr = "host=" + dbHost +
                              " port=" + dbPort +
                              " dbname=" + dbName +
                              " user=" + dbUser +
                              " password=" + dbPassword;

        PostgresDB db(connStr);
        BlocklistScraper scraper;

        std::string geoDbPath = "data/IP2LOCATION-LITE-DB5.BIN";
        std::cout << "Loading IP2Location Database: " << geoDbPath << "\n";
        IP2LocationProvider geoProvider(geoDbPath);
        DataPipeline pipeline(&scraper, &geoProvider, &db);

        int intervalHours = 12;
        std::cout << "Setting interval: " << intervalHours << "h\n";
        UpdateManager updateManager(&pipeline, intervalHours, configs);

        updateManager.start();

        ApiServer apiServer(&db);
        int port = 8080;

        std::cout << "Starting ApiServer on port: " << port << "\n";
        apiServer.start(port);

        std::cout << "ApiServer stopped\n";
        updateManager.stop();
        std::cout << "Closing\n";
    } catch (const std::exception &e) {
        std::cerr << "ERROR: " << e.what() << "\n";
        return 1;
    } catch (...) {
        std::cerr << "ERROR\n";
        return 1;
    }

    return 0;
}
