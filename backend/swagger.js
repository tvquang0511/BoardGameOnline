const swaggerJSDoc = require("swagger-jsdoc");

const PORT = process.env.PORT || 3000;

const options = {
  definition: {
    openapi: "3.0.0",
    info: {
      title: "Game Platform API",
      version: "1.0.0",
      description: "API documentation for the backend",
    },
    servers: [
      {
        url: `http://localhost:${PORT}/api`,
        description: "Local server",
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        apiKeyAuth: {
          type: "apiKey",
          in: "header",
          name: "x-api-key",
        },
      },
    },
    // Áp dụng mặc định cho toàn bộ endpoint:
    // Nếu có endpoint public, bạn có thể override ở từng route.
    security: [{ apiKeyAuth: [] }],
  },

  // Quét JSDoc trong routes/controllers (bạn có thể chỉnh path theo project)
  apis: ["./routes/**/*.js", "./controllers/**/*.js"],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;