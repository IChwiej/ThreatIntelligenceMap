#include <gtest/gtest.h>
#include "core/ConfigLoader.hpp"
#include "core/IPConverter.hpp"
#include <fstream>
#include <cstdio>

TEST(CoreTests, ConfigLoaderParsesJsonCorrectly) {
    std::string testFilePath = "test_config_temp.json";
    std::ofstream outFile(testFilePath);
    outFile << R"({
        "sources": [
            {
                "host": "http://test.com",
                "path": "/test.txt",
                "threatType": "TEST_ATTACK"
            }
        ]
    })";
    outFile.close();
    auto configs = ConfigLoader::loadConfig(testFilePath);

    ASSERT_EQ(configs.size(), 1);
    EXPECT_EQ(configs[0].host, "http://test.com");
    EXPECT_EQ(configs[0].path, "/test.txt");
    EXPECT_EQ(configs[0].threatType, "TEST_ATTACK");

    std::remove(testFilePath.c_str());
}

TEST(CoreTests, ConfigLoaderHandlesMissingFile) {
    auto configs = ConfigLoader::loadConfig("jakis_nieistniejacy_plik_12345.json");

    EXPECT_TRUE(configs.empty());
}

TEST(CoreTests, IPv4ToDecimal) {
    std::string ip = "192.168.0.1";
    std::uint32_t ip_decimal = IPConverter::toDecimal(ip);

    EXPECT_EQ(ip_decimal, 3232235521);
}

TEST(CoreTests, DecimalToIPv4) {
    std::uint32_t ip_decimal = 3232235521;
    std::string ip = IPConverter::fromDecimal(ip_decimal);

    EXPECT_EQ(ip, "192.168.0.1");
}
