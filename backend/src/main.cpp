#include <iostream>
#include <vector>
#include <exception>
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

        std::string configPath = "../data/config.json";
        std::cout << "Loading config: " << configPath << "\n";
        std::vector<ScraperConfig> configs = ConfigLoader::loadConfig(configPath);

        std::cout << "Initializing Database\n";
        PostgresDB db("host=localhost dbname=threat_db user=admin password=admin");
        BlocklistScraper scraper;

        std::string geoDbPath = "../data/IP2LOCATION-LITE-DB5.BIN";
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
