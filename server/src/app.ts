import express, {
  type Express,
  type NextFunction,
  type Request,
  type Response,
} from "express";
import type { CheckoutSessionService } from "./adyen-checkout.js";

interface AppDependencies {
  checkoutSessions: CheckoutSessionService;
  clientKey: string;
}

interface ErrorResponse {
  error: {
    code: string;
    message: string;
  };
}

function sendError(
  response: Response<ErrorResponse>,
  status: number,
  code: string,
  message: string,
): void {
  response.status(status).json({ error: { code, message } });
}

function isEmptyObject(value: unknown): value is Record<string, never> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.keys(value).length === 0
  );
}

export function createApp(dependencies: AppDependencies): Express {
  const app = express();
  app.disable("x-powered-by");
  app.use(express.json({ limit: "2kb", strict: true }));

  app.get("/api/checkout/config", (_request, response) => {
    response.json({
      environment: "test",
      clientKey: dependencies.clientKey,
    });
  });

  app.post(
    "/api/checkout/sessions",
    async (request: Request, response: Response) => {
      if (!isEmptyObject(request.body)) {
        sendError(
          response,
          400,
          "INVALID_REQUEST",
          "The checkout request must not include product or price data.",
        );
        return;
      }

      try {
        const session = await dependencies.checkoutSessions.createSession();
        response.status(201).json({ session });
      } catch {
        sendError(
          response,
          502,
          "CHECKOUT_SESSION_UNAVAILABLE",
          "The TEST checkout could not be started. Please try again.",
        );
      }
    },
  );

  app.use(
    (
      error: unknown,
      _request: Request,
      response: Response,
      _next: NextFunction,
    ) => {
      if (error instanceof SyntaxError) {
        sendError(response, 400, "INVALID_JSON", "The request body is invalid.");
        return;
      }

      sendError(
        response,
        500,
        "INTERNAL_ERROR",
        "The server could not process the request.",
      );
    },
  );

  return app;
}
