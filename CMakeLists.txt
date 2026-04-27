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

file(GLOB_RECURSE SOURCES "src/*.cpp")

add_executable(ThreatIntelligenceMap ${SOURCES})

target_link_libraries(ThreatIntelligenceMap PRIVATE Crow::Crow)
target_include_directories(ThreatIntelligenceMap PRIVATE src)