import express from "express";
import compression from "compression";
import cors from "cors";
import helmet from "helmet";
import morgan from "morgan";
import swaggerUi from "swagger-ui-express";
import env from "./config/env.js";
import apiRouter from "./routes/index.router.js";
import notFoundHandler from "./middlewares/notFound.middleware.js";
import errorHandler from "./middlewares/error.middleware.js";
import { openapiDocument } from "./docs/openapi.js";

const app = express();

app.set("trust proxy", 1);

app.use(
  helmet({
    contentSecurityPolicy: {
      directives: {
        ...helmet.contentSecurityPolicy.getDefaultDirectives(),
        "script-src": ["'self'", "'unsafe-inline'"],
        "style-src": ["'self'", "'unsafe-inline'"],
        "img-src": ["'self'", "data:", "https:"],
      },
    },
  }),
);
app.use(
  cors({
    origin: env.CORS_ORIGIN === "*" ? true : env.CORS_ORIGIN.split(",").map((o) => o.trim()),
    credentials: true,
  }),
);
app.use(compression());

/* Skip body-parser for multipart (file upload) — formidable handles it */
app.use(express.urlencoded({ extended: true }))
app.use(express.json({ limit: "10mb" }));

if (env.NODE_ENV === "development") {
  app.use(morgan("dev"));
} else if (env.NODE_ENV === "production") {
  app.use(morgan("combined"));
}

app.use("/api-docs.json", (_req, res) => {
  res.setHeader("Content-Type", "application/json");
  res.send(openapiDocument);
});

app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openapiDocument, { explorer: false }));

app.use("/api/v1", apiRouter);

app.use(notFoundHandler);
app.use(errorHandler);

export default app;
