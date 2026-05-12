#include <gtest/gtest.h>
#include <pqxx/pqxx>
#include "../src/db/PostgresDB.hpp"

class PostgresDBTest : public ::testing::Test {
protected:
    std::string devConnStr = "postgresql://admin:admin@localhost:5432/threat_db";


    std::string testMarker = "TEST_DATA_DO_NOT_USE";


    void SetUp() override {
    }


    void TearDown() override {
        try {
            pqxx::connection c(devConnStr);
            pqxx::work w(c);


            w.exec_params("DELETE FROM threat_records WHERE threat_type = $1", testMarker);
            w.commit();
        } catch (const std::exception &e) {
            std::cerr << "Blad podczas sprzatania po testach: " << e.what() << std::endl;
        }
    }
};

TEST_F(PostgresDBTest, CanSaveAndRetrieveThreatsWithinBounds) {
    PostgresDB db(devConnStr);
    GeoLocation locKrakow;
    locKrakow.country = "Poland";
    locKrakow.city = "Krakow";
    locKrakow.latitude = 50.0647;
    locKrakow.longitude = 19.9450;


    std::vector<ThreatRecord> fakeRecords = {
        ThreatRecord(3232235776, "192.168.1.0", testMarker, locKrakow)
    };


    bool saveResult = db.saveBatch(fakeRecords);
    EXPECT_TRUE(saveResult);


    std::string krakowBounds = "19.8,49.9,20.1,50.2";
    std::vector<ThreatRecord> retrievedRecords = db.getRecords(krakowBounds);


    bool foundOurTestRecord = false;
    for (const auto &rec: retrievedRecords) {
        if (rec.threatType == testMarker) {
            foundOurTestRecord = true;
            EXPECT_EQ(rec.ipAddress, "192.168.1.0");
            break;
        }
    }

    EXPECT_TRUE(foundOurTestRecord) << "Nie znaleziono testowego rekordu w wyznaczonym obszarze!";
}
