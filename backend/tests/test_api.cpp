#include <gtest/gtest.h>
#include <gmock/gmock.h>
#include "../src/api/ApiServer.hpp"
#include "../src/db/IDataBase.hpp"
#include "../src/models/ThreatRecord.hpp"

class MockDataBase : public IDataBase {
public:
    MOCK_METHOD(std::vector<ThreatRecord>, getRecords, (const std::string &bounds), (override));
    MOCK_METHOD(bool, saveBatch, (const std::vector<ThreatRecord> &records), (override));
};

class ApiTests : public ::testing::Test {
protected:
    MockDataBase mockDb;
    std::unique_ptr<ApiServer> server;

    void SetUp() override {
        server = std::make_unique<ApiServer>(&mockDb);

        server->app.validate();
    }


    crow::response simulateGetRequest(const std::string &urlString) {
        crow::request req;
        req.method = crow::HTTPMethod::Get;

        size_t pos = urlString.find('?');
        if (pos != std::string::npos) {
            req.url = urlString.substr(0, pos);
            req.url_params = crow::query_string(urlString);
        } else {
            req.url = urlString;
        }

        crow::response res;
        server->app.handle_full(req, res);

        return res;
    }
};


TEST_F(ApiTests, Returns400WhenBoundsParameterIsMissing) {
    crow::response res = simulateGetRequest("/api/threats");

    EXPECT_EQ(res.code, 400);
    EXPECT_EQ(res.body, "{\"error\": \"Missing bounds query parameter\"}");
}

TEST_F(ApiTests, ReturnsEmptyJsonArrayWhenNoRecordsFound) {
    std::string testBounds = "10.0,20.0,30.0,40.0";

    EXPECT_CALL(mockDb, getRecords(testBounds))
            .WillOnce(testing::Return(std::vector<ThreatRecord>{}));

    crow::response res = simulateGetRequest("/api/threats?bounds=" + testBounds);

    EXPECT_EQ(res.code, 200);
    EXPECT_EQ(res.get_header_value("Content-Type"), "application/json");
    EXPECT_EQ(res.body, "[]");
}

TEST_F(ApiTests, ReturnsJsonArrayWithRecords) {
    std::string testBounds = "50.0,60.0,70.0,80.0";

    ThreatRecord record1;
    ThreatRecord record2;

    std::vector<ThreatRecord> dummyRecords = {record1, record2};

    EXPECT_CALL(mockDb, getRecords(testBounds))
            .WillOnce(testing::Return(dummyRecords));

    crow::response res = simulateGetRequest("/api/threats?bounds=" + testBounds);
    EXPECT_EQ(res.code, 200);
    EXPECT_EQ(res.get_header_value("Content-Type"), "application/json");

    std::string expectedJson = "[" + record1.toJSON() + "," + record2.toJSON() + "]";
    EXPECT_EQ(res.body, expectedJson);
}
