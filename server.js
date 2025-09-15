// Простой сервер для проверки
const http = require("http");

const port = process.env.PORT || 3000;
const host = process.env.HOST || "0.0.0.0";

const server = http.createServer((req, res) => {
  if (req.url === "/health") {
    res.writeHead(200, { "Content-Type": "application/json" });
    res.end(
      JSON.stringify({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
        port: port,
        host: host,
      }),
    );
  } else {
    res.writeHead(200, { "Content-Type": "text/plain" });
    res.end("Hello from Railway!");
  }
});

server.listen(port, host, () => {
  console.log(`Server running on http://${host}:${port}`);
  console.log(`Health check available at http://${host}:${port}/health`);
});

server.on("error", (err) => {
  console.error("Server error:", err);
  process.exit(1);
});
