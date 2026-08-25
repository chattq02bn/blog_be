import type { ErrorRequestHandler } from "express";
import { flattenError, ZodError } from "zod";
import { Prisma } from "../generated/prisma/client.js";
import ApiError from "../utils/ApiError.js";
import env from "../config/env.js";
import { logger } from "../utils/logger.js";

const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  let statusCode = 500;
  let message = "Internal server error";
  let details: unknown;

  if (err instanceof ApiError) {
    statusCode = err.statusCode;
    message = err.message;
    details = err.details;
  } else if (err instanceof ZodError) {
    statusCode = 422;
    message = "Validation failed";
    details = flattenError(err);
  } else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2002") {
      statusCode = 409;
      message = "A record with this value already exists";
      details = { targets: err.meta?.targets };
    } else if (err.code === "P2025") {
      statusCode = 404;
      message = "Record not found";
    } else {
      statusCode = 400;
      message = `Database error (${err.code})`;
    }
  } else if (err instanceof Error && statusCode === 500) {
    message = env.NODE_ENV === "production" ? "Internal server error" : err.message;
  }

  if (statusCode >= 500) {
    logger.error("[error]", err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    ...(details !== undefined ? { details } : {}),
    ...(env.NODE_ENV === "development" && err instanceof Error ? { stack: err.stack } : {}),
  });
};

export default errorHandler;
