#include "ApiServer.hpp"

ApiServer::ApiServer(IDataBase *database) : db(database) {
    setupRoutes();
}

void ApiServer::setupRoutes() {
    auto &cors = app.get_middleware<crow::CORSHandler>();

    cors.global()
            .headers("Origin", "Content-Type", "Accept", "Authorization")
            .methods("GET"_method, "POST"_method, "OPTIONS"_method)
            .origin("*");

    CROW_ROUTE(app, "/api/threats")([this](const crow::request &req) {
        char *bounds_param = req.url_params.get("bounds");
        if (!bounds_param) {
            return crow::response(400, "{\"error\": \"Missing bounds query parameter\"}");
        }

        std::string bounds(bounds_param);

        std::string jsonResponse = db->getRecordsAsJson(bounds);

        crow::response res(200, jsonResponse);
        res.set_header("Content-Type", "application/json");

        return res;
    });
}

void ApiServer::start(int port) {
    app.port(port).use_compression(crow::compression::algorithm::GZIP).multithreaded().run();
}
