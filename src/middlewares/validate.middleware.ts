import type { RequestHandler } from "express";
import { type ZodTypeAny, flattenError } from "zod";
import ApiError from "../utils/ApiError.js";

type ValidationSource = "body" | "query" | "params";

const validate =
  (schema: ZodTypeAny, source: ValidationSource = "body"): RequestHandler =>
  (req, _res, next) => {
    const result = schema.safeParse(req[source]);

    if (!result.success) {
      next(ApiError.unprocessableEntity("Validation failed", flattenError(result.error)));
      return;
    }

    Object.defineProperty(req, source, {
      value: result.data,
      writable: true,
      enumerable: true,
      configurable: true,
    });

    next();
  };

export default validate;
