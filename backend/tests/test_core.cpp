#include <gtest/gtest.h>
#include "core/ConfigLoader.hpp"
#include "core/IPConverter.hpp"
#include "core/DataPipeline.hpp"
#include "scraper/IDataSource.hpp"
#include "geo/IGeoProvider.hpp"
#include "db/IDataBase.hpp"
#include "models/GeoLocation.hpp"
#include "models/ThreatRecord.hpp"
#include <fstream>
#include <cstdio>
#include <vector>

class FakeDataSource : public IDataSource {
public:
    void setTarget(const std::string &newHost, const std::string &newPath) override {
    }

    std::string fetchRawData() override {
        return "192.168.1.5";
    }
};

class FakeGeoProvider : public IGeoProvider {
public:
    GeoLocation getLocation(uint32_t ipDec) override {
        return GeoLocation{52.23, 21.01, "Poland", "Warsaw"};
    }
};

class FakeDatabase : public IDataBase {
public:
    std::vector<ThreatRecord> savedRecords;

    bool saveBatch(const std::vector<ThreatRecord> &records) override {
        savedRecords = records;
        return true;
    }

    std::vector<ThreatRecord> getRecords(const std::string &bounds) override {
        return savedRecords;
    }
};

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

TEST(CoreTests, DataPipeline) {
    FakeDataSource fakeSource;
    FakeGeoProvider fakeGeo;
    FakeDatabase fakeDb;

    DataPipeline pipeline(&fakeSource, &fakeGeo, &fakeDb);
    std::vector<ScraperConfig> testConfigs = {
        {"http://test.com", "/test.txt", "BotnetThreat"}
    };

    pipeline.run(testConfigs);


    ASSERT_EQ(fakeDb.savedRecords.size(), 1);
    EXPECT_EQ(fakeDb.savedRecords[0].ipAddress, "192.168.1.5");
    EXPECT_EQ(fakeDb.savedRecords[0].threatType, "BotnetThreat");
    EXPECT_EQ(fakeDb.savedRecords[0].getGeoLocation().city, "Warsaw");
}
