#include "UpdateManager.hpp"
#include <chrono>


UpdateManager::UpdateManager(DataPipeline *pipeline, int intervalHours,
                             std::vector<ScraperConfig> configs) : pipeline(pipeline),
                                                                   intervalHours(intervalHours), configs(configs),
                                                                   isRunning(false) {
}

UpdateManager::~UpdateManager() {
    stop();
}

void UpdateManager::workerLoop() {
    while (isRunning) {
        if (pipeline) {
            pipeline->run(this->configs);
        }
        std::unique_lock<std::mutex> lock(cv_m);

        cv.wait_for(lock, std::chrono::hours(intervalHours), [this]() {
            return !isRunning.load();
        });
    }
}

void UpdateManager::start() {
    if (isRunning) return;

    isRunning = true;
    workerThread = std::thread(&UpdateManager::workerLoop, this);
}

void UpdateManager::stop() {
    if (!isRunning) return;

    isRunning = false;

    cv.notify_all();

    if (workerThread.joinable()) {
        workerThread.join();
    }
}
