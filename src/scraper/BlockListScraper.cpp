#include "BlockListScraper.hpp"
#include <httplib.h>


BlocklistScraper::BlocklistScraper(const std::string &url) : sourceUrl(url) {
}

std::string BlocklistScraper::fetchRawData() {
    std::string rawData = "";

    httplib::Client cli(sourceUrl);

    cli.set_follow_location(true);

    auto res = cli.Get("/lists/all.txt");

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
