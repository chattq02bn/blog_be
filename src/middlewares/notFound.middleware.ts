import ApiError from "../utils/ApiError.js";

function notFoundHandler(req: { method: string; originalUrl: string }, _res: unknown, next: (err: unknown) => void): void {
  next(ApiError.notFound(`Route ${req.method} ${req.originalUrl} not found`));
}

export default notFoundHandler;
