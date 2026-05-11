#include <gtest/gtest.h>
#include <stdexcept>
#include "../src/geo/IP2LocationProvider.hpp"

TEST(GeoTests, ThrowsExceptionOnInvalidDatabasePath) {
    EXPECT_THROW({
                 IP2LocationProvider provider("nieistniejaca_sciezka/baza.bin");
                 }, std::runtime_error);
}

TEST(GeoTests, ResolvesValidIpAddress) {
    const std::string testDbPath = "../data/IP2LOCATION-LITE-DB5.BIN";
    try {
        IP2LocationProvider provider(testDbPath);

        uint32_t testIpDec = 134744072;

        GeoLocation result = provider.getLocation(testIpDec);

        EXPECT_EQ(result.country, "United States of America");
        EXPECT_NE(result.latitude, 0.0);
    } catch (const std::runtime_error &e) {
        GTEST_SKIP() << "Pominięto test: Brak pliku testowego bazy danych. Błąd: " << e.what();
    }
}
