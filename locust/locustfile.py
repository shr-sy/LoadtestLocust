from locust import HttpUser, between, task


class SnakeArenaUser(HttpUser):
    wait_time = between(0.2, 1.0)

    @task(6)
    def load_game(self):
        self.client.get("/", name="GET /")

    @task(3)
    def load_styles(self):
        self.client.get("/style.css", name="GET /style.css")

    @task(3)
    def load_script(self):
        self.client.get("/app.js", name="GET /app.js")

    @task(1)
    def probe_health(self):
        response = self.client.get("/", name="health probe")
        response.raise_for_status()
