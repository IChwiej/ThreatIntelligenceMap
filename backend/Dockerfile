FROM ubuntu:24.04 AS builder

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    build-essential \
    cmake \
    git \
    libpq-dev \
    zlib1g-dev \
    libasio-dev \
    python3 \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY CMakeLists.txt .
COPY data ./data
COPY src ./src
RUN mkdir build && cd build && cmake -DBUILD_TESTING=OFF ..

COPY . .
RUN cd build && make -j$(nproc)

FROM ubuntu:24.04

ENV DEBIAN_FRONTEND=noninteractive

RUN apt-get update && apt-get install -y \
    libpq5 \
    zlib1g \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

WORKDIR /app

COPY --from=builder /app/build/ThreatIntelligenceMap .
COPY --from=builder /app/data ./data

EXPOSE 8080

CMD ["./ThreatIntelligenceMap"]