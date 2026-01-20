require("dotenv").config();

const express = require("express");
const cors = require("cors");
const morgan = require("morgan");
const helmet = require("helmet");

const routes = require("./routes");
const { requireApiKey } = require("./middlewares/apiKey.middleware");

// Swagger
const swaggerUi = require("swagger-ui-express");
const YAML = require("yamljs");
const swaggerDocument = YAML.load("./openapi.yaml");

const app = express();

app.use(helmet());

app.use(cors({
  origin: [
    "https://board-game-online-git-completecode-vuquangs-projects-2943ee1c.vercel.app",
    "https://board-game-online.vercel.app",
    "http://localhost:5173"
  ],
  methods: ["GET", "POST", "PUT", "DELETE", "PATCH", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization", "x-api-key"],
  credentials: true
}));

// 🔥 BẮT BUỘC cho CORS preflight
app.options("*", cors());

app.use(express.json());
app.use(morgan("dev"));

// Health check (public)
app.get("/health", (req, res) => {
  res.json({
    ok: true,
    timestamp: new Date().toISOString(),
  });
});

// Swagger docs (public)
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerDocument));

// API routes (BẢO VỆ BẰNG API KEY)
app.use("/api", requireApiKey, routes);

// 404 handler
app.use("*", (req, res) => {
  res.status(404).json({ message: "Route not found" });
});

// Error handler
app.use((err, req, res, next) => {
  console.error("Error:", err.message);

  const status = err.status || 500;
  const message = err.message || "Internal Server Error";

  res.status(status).json({
    message,
    ...(process.env.NODE_ENV === "development" && { stack: err.stack }),
  });
});

module.exports = app;
