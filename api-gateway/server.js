const express = require("express");
const { createProxyMiddleware } = require("http-proxy-middleware");
const cors = require("cors");

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());

// Service routes
app.use(
  "/api/auth",
  createProxyMiddleware({
    target: "http://localhost:3001",
    changeOrigin: true,
    pathRewrite: {
      "^/api/auth": "/api/auth",
    },
  })
);

app.use(
  "/api/images",
  createProxyMiddleware({
    target: "http://localhost:3002",
    changeOrigin: true,
    pathRewrite: {
      "^/api/images": "/api/images",
    },
  })
);

app.use(
  "/api/gallery",
  createProxyMiddleware({
    target: "http://localhost:3003",
    changeOrigin: true,
    pathRewrite: {
      "^/api/gallery": "/api/gallery",
    },
  })
);

// Health check endpoint
app.get("/health", (req, res) => {
  res.json({ status: "API Gateway is running" });
});

app.listen(PORT, () => {
  console.log(`API Gateway running on port ${PORT}`);
});
