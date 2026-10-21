# Tiny server load tester

One Express endpoint at `/` and a script that sends requests.

## Run

```sh
docker compose up --build -d app
docker compose run --build --rm load
```

In another terminal, watch CPU, RAM, and network traffic:

```sh
docker stats
```

Stop with `docker compose down`.

## Edit config.json

| Setting | What it controls |
| --- | --- |
| requestsPerMinute | Traffic rate (600 = about 10 requests/sec) |
| durationSeconds | Test duration |
| maxConcurrency | Maximum requests in flight |
| cpuMs | CPU work per request |
| memoryMbPerRequest | RAM allocated per active request |
| holdMs | How long to hold the RAM before responding |
| responseKb | Response size for network traffic |

Restart after changing server workload: `docker compose restart app`.
Test settings apply on the next run. No rebuild needed for config changes.
Defaults run for 30 seconds. Increase settings gradually on a small server.
CPU work deliberately blocks Node's single event loop. RAM may stay elevated
until Node reclaims it. Docker NET I/O shows cumulative traffic.

To test a remote server, run the load generator on another computer:

```sh
docker compose run --build --rm -e TARGET_URL=http://YOUR-SERVER:3000/ load
```

This avoids counting generator CPU and RAM as server usage.
RPM is approximate; slow responses and the concurrency cap can reduce throughput.
The script reports completed, failed, skipped requests and received MB.

Without Docker (Node.js 22+): `npm ci`, then `npm start`.
In another terminal: `npm run load`.
