# Snake Arena Load Test Lab

A browser Snake game packaged with a repeatable Locust distributed-load setup for Podman.

## Architecture

- `snake-game`: Nginx serves the static game on port `8080`.
- `locust-master`: Locust controller and web UI on port `8089`.
- `locust-worker-1` and `locust-worker-2`: separate worker containers generating traffic.

The Locust workers hit the static game assets and health endpoints. This exercises the same HTTP surface a browser uses without requiring browser automation for every load user.

## Start with Podman Compose

From this directory:

```powershell
podman compose up --build -d
podman compose ps
```

Open the game at <http://localhost:8080> and Locust at <http://localhost:8089>.

In the Locust UI, use `snake-game` as the host, or start a headless run:

```powershell
podman compose run --rm locust-master locust -f /mnt/locust/locustfile.py --headless -u 100 -r 10 -t 2m --host http://snake-game
```

The master/worker topology can also be started explicitly:

```powershell
podman compose up --build -d snake-game locust-master locust-worker-1 locust-worker-2
```

Stop and remove the stack:

```powershell
podman compose down
```

## Direct Podman commands

If `podman compose` is unavailable, build and run the game directly:

```powershell
podman build -t snake-game:local -f app/Containerfile app
podman run -d --name snake-game --publish 8080:80 snake-game:local
```

Build the Locust image:

```powershell
podman build -t snake-locust:local -f locust/Containerfile locust
```

The Compose file is the recommended path because it gives the master, workers, and game a shared network and separate container identities.
