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
    "http://localhost:5173",
  ],
  credentials: true,
}));



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

// API routes (require x-api-key)
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