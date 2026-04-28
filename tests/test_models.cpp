#include <gtest/gtest.h>
#include "models/GeoLocation.hpp"
#include "models/ThreatRecord.hpp"

TEST(ModelsTests, GeoLocation) {
    GeoLocation location{11.22, 22.11, "Thailand", "Bangkok"};

    EXPECT_DOUBLE_EQ(location.latitude, 11.22);
    EXPECT_DOUBLE_EQ(location.longitude, 22.11);
    EXPECT_EQ(location.country, "Thailand");
    EXPECT_EQ(location.city, "Bangkok");
}

TEST(ModelsTests, ThreatRecord) {
    GeoLocation location{11.22, 22.11, "Thailand", "Bangkok"};
    ThreatRecord record(4294967000, "192.168.0.1", "ssh", location);

    std::string jsonResult = record.toJSON();
    EXPECT_TRUE(jsonResult.find("192.168.0.1") != std::string::npos);
    EXPECT_TRUE(jsonResult.find("Bangkok") != std::string::npos);
}
