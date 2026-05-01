#include <gtest/gtest.h>
#include "scraper/BlockListScraper.hpp"


TEST(ScraperTests, BlockList) {
    BlocklistScraper scraper("https://lists.blocklist.de", "/lists/ssh.txt");
    std::string result = scraper.fetchRawData();
    EXPECT_FALSE(result.empty()) << "Empty string";
    std::cout << "\n--- WYNIK POBIERANIA ---" << std::endl;
    std::cout << "Rozmiar (bajty): " << result.length() << std::endl;
    std::cout << "Początek pliku:\n" << result.substr(0, 100) << "...\n";
    std::cout << "------------------------\n" << std::endl;
}

