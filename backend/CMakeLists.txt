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

FetchContent_Declare(
        httplib
        GIT_REPOSITORY https://github.com/yhirose/cpp-httplib.git
        GIT_TAG master
)
FetchContent_MakeAvailable(httplib)

file(GLOB_RECURSE SOURCES CONFIGURE_DEPENDS "src/*.cpp" "src/*.hpp" "src/*.h")

list(FILTER SOURCES EXCLUDE REGEX "main\\.cpp$")

add_executable(ThreatIntelligenceMap src/main.cpp ${SOURCES})

target_link_libraries(ThreatIntelligenceMap PRIVATE
        Crow::Crow
        nlohmann_json::nlohmann_json
        httplib::httplib
)
target_include_directories(ThreatIntelligenceMap PRIVATE src)

include(CTest)
find_package(GTest REQUIRED)
include(GoogleTest)

file(GLOB_RECURSE TEST_SOURCES CONFIGURE_DEPENDS "tests/*.cpp")

add_executable(tests
        ${TEST_SOURCES}
        ${SOURCES}
)

target_include_directories(tests PUBLIC src)

target_link_libraries(tests
        GTest::gtest_main
        nlohmann_json::nlohmann_json
        httplib::httplib
)
enable_testing()
gtest_discover_tests(tests)