#include "BlockListScraper.hpp"
#include <httplib.h>
#include <iostream>

BlocklistScraper::BlocklistScraper(const std::string &targetHost, const std::string &targetPath) : host(targetHost),
    path(targetPath) {
}

void BlocklistScraper::setTarget(const std::string &newHost, const std::string &newPath) {
    host = newHost;
    path = newPath;
}

std::string BlocklistScraper::fetchRawData() {
    std::string rawData = "";

    httplib::Client cli(host);

    cli.set_follow_location(true);

    auto res = cli.Get(path);

    if (res) {
        if (res->status == 200) {
            rawData = res->body;
        } else {
            std::cerr << "Server error, status code: " << res->status << std::endl;
        }
    } else {
        auto err = res.error();
        std::cerr << "Connection error: " << httplib::to_string(err) << std::endl;
    }

    return rawData;
}
