#pragma once
#include "DataPipeline.hpp"
#include <atomic>
#include <thread>
#include <mutex>
#include  <condition_variable>
#include <vector>


class UpdateManager {
private:
    DataPipeline *pipeline;
    int intervalHours;
    std::atomic<bool> isRunning;
    std::vector<ScraperConfig> configs;
    std::thread workerThread;
    std::condition_variable cv;
    std::mutex cv_m;

    void workerLoop();

public:
    UpdateManager(DataPipeline *pipeline, int intervalHours, std::vector<ScraperConfig> configs);

    ~UpdateManager();

    void start();

    void stop();
};
