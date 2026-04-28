cmake_minimum_required(VERSION 3.28)
project(ThreatIntelligenceMap)

set(CMAKE_CXX_STANDARD 20)

include(FetchContent)
FetchContent_Declare(
        Crow
        GIT_REPOSITORY https://github.com/CrowCpp/Crow.git
        GIT_TAG master
)
FetchContent_MakeAvailable(Crow)

FetchContent_Declare(
        nlohmann_json
        GIT_REPOSITORY https://github.com/nlohmann/json.git
        GIT_TAG master
)
FetchContent_MakeAvailable(nlohmann_json)

file(GLOB_RECURSE SOURCES "src/*.cpp")

add_executable(ThreatIntelligenceMap ${SOURCES})

target_link_libraries(ThreatIntelligenceMap PRIVATE Crow::Crow nlohmann_json::nlohmann_json)
target_include_directories(ThreatIntelligenceMap PRIVATE src)

include(CTest)
find_package(GTest REQUIRED)
include(GoogleTest)

add_executable(tests
        tests/test_models.cpp
)

target_include_directories(tests PUBLIC src)

target_link_libraries(tests GTest::gtest_main nlohmann_json::nlohmann_json)
enable_testing()
gtest_discover_tests(tests)