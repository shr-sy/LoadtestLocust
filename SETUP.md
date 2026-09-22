# Snake Game + Locust Load Testing

Short operator guide for running the Snake application and a distributed Locust test with Podman on Windows.

## 1. Project and Prerequisites

Project directory:

```text
D:\snake-game-loadtest
```

Podman executable on this machine:

```text
C:\Users\shruti_g\AppData\Local\Programs\Podman\podman.exe
```

If `podman` is not recognized in PowerShell:

```powershell
$podman = 'C:\Users\shruti_g\AppData\Local\Programs\Podman\podman.exe'
```

Start and verify Podman:

```powershell
podman machine start
podman system connection default podman-machine-default-root
podman info
podman run --rm quay.io/podman/hello
```

## 2. Build the Images

```powershell
Set-Location D:\snake-game-loadtest

podman build `
  --tag snake-game:local `
  --file app\Containerfile `
  app

podman build `
  --tag snake-locust:local `
  --file locust\Containerfile `
  locust

podman images
```

The Snake image uses Nginx to serve the static game. The Locust image contains Python, Locust 2.40.4, and `locust/locustfile.py`.

## 3. Create the Network and Start Containers

Remove an old run if necessary:

```powershell
podman rm --force snake-game locust-master locust-worker-1 locust-worker-2 2>$null
podman network rm snake-loadtest 2>$null
```

Create the shared network:

```powershell
podman network create snake-loadtest
```

Start the Snake application:

```powershell
podman run --detach `
  --name snake-game `
  --network snake-loadtest `
  --publish 8080:80 `
  localhost/snake-game:local
```

Start the Locust master:

```powershell
podman run --detach `
  --name locust-master `
  --network snake-loadtest `
  --publish 8089:8089 `
  --publish 5557:5557 `
  localhost/snake-locust:local `
  --master `
  --master-bind-host=0.0.0.0 `
  --master-bind-port=5557 `
  --web-host=0.0.0.0 `
  --web-port=8089 `
  --locustfile=/mnt/locust/locustfile.py
```

Start Locust worker 1:

```powershell
podman run --detach `
  --name locust-worker-1 `
  --network snake-loadtest `
  localhost/snake-locust:local `
  --worker `
  --master-host=locust-master `
  --master-port=5557 `
  --locustfile=/mnt/locust/locustfile.py
```

Start Locust worker 2:

```powershell
podman run --detach `
  --name locust-worker-2 `
  --network snake-loadtest `
  localhost/snake-locust:local `
  --worker `
  --master-host=locust-master `
  --master-port=5557 `
  --locustfile=/mnt/locust/locustfile.py
```

Verify the four containers:

```powershell
podman ps
```

Expected names:

```text
snake-game
locust-master
locust-worker-1
locust-worker-2
```

## 4. Open the Web UIs and Run the Test

Snake application: <http://localhost:8080>

Locust Web UI: <http://localhost:8089>

In Locust, enter:

```text
Host: http://snake-game
Users: 20
Spawn rate: 10
```

Click **Start swarming** and confirm that two workers are connected.

The test requests these application resources:

```text
GET /
GET /style.css
GET /app.js
```

For a headless test instead of the Web UI:

```powershell
podman run --rm `
  --network snake-loadtest `
  localhost/snake-locust:local `
  --headless `
  --users 20 `
  --spawn-rate 10 `
  --run-time 2m `
  --host http://snake-game `
  --locustfile=/mnt/locust/locustfile.py
```

## 5. Verify Results and Clean Up

Check that both workers registered:

```powershell
podman logs --tail 40 locust-master
```

Check worker logs:

```powershell
podman logs --tail 20 locust-worker-1
podman logs --tail 20 locust-worker-2
```

Read Locust statistics:

```powershell
Invoke-RestMethod `
  -Uri 'http://localhost:8089/stats/requests' | `
  ConvertTo-Json -Depth 5
```

Important fields:

```text
user_count
worker_count
fail_ratio
total_rps
stats
```

The verified run used 20 users across 2 workers and produced 285 requests with 0 failures.

Stop a Web UI test using the **Stop** button in Locust.

Stop and delete containers:

```powershell
podman rm --force `
  snake-game `
  locust-master `
  locust-worker-1 `
  locust-worker-2
```

Remove the network:

```powershell
podman network rm snake-loadtest
```

## 6. Access From Another Laptop

`localhost` works only on the machine running Podman. For another device on the same Wi-Fi or LAN, find the Podman host laptop's IPv4 address:

```powershell
ipconfig
```

Find the active adapter's `IPv4 Address`, for example `192.168.1.25`. On the other laptop, use:

```text
Snake application: http://192.168.1.25:8080
Locust Web UI:    http://192.168.1.25:8089
```

Allow the two ports through Windows Firewall. Run PowerShell as Administrator on the Podman host:

```powershell
New-NetFirewallRule -DisplayName 'Snake Game 8080' -Direction Inbound -Protocol TCP -LocalPort 8080 -Action Allow
New-NetFirewallRule -DisplayName 'Locust Web UI 8089' -Direction Inbound -Protocol TCP -LocalPort 8089 -Action Allow
```

The other laptop must be on the same network, and the Podman host must remain powered on with the containers running:

```powershell
podman ps
```

Do not expose port `8089` directly to the public internet. Locust's dashboard is an operational control panel and should be protected behind VPN, an authenticated reverse proxy, or a private tunnel. The application can be shared publicly through a properly secured tunnel or deployed to a hosted server.

## Optional Compose Commands

The project includes `podman-compose.yml` with the same topology. If a Compose provider is installed:

```powershell
podman compose up --build -d
podman compose ps
podman compose down
```

The current Podman installation did not include a Compose provider, so native `podman run` commands were used for validation.
