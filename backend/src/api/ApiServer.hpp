#pragma once
#include "db/IDataBase.hpp"
#define CROW_ENABLE_COMPRESSION
#include "../crow-src/include/crow.h"
#include "../crow-src/include/crow/middlewares/cors.h"

class ApiServer {
    friend class ApiTests;

private:
    crow::App<crow::CORSHandler> app;
    IDataBase *db;

    void setupRoutes();

public:
    ApiServer(IDataBase *database);

    void start(int port);
};
