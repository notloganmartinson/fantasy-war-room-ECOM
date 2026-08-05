import "dotenv/config";
import { randomUUID } from "node:crypto";

function requireEnvironmentVariable(name: string): string {
  const value = process.env[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

const apiKey = requireEnvironmentVariable("ADYEN_API_KEY");
const merchantAccount = requireEnvironmentVariable(
  "ADYEN_MERCHANT_ACCOUNT",
);

const reference = `FWR-${Date.now()}`;
const idempotencyKey = randomUUID();

const response = await fetch(
  "https://checkout-test.adyen.com/v72/sessions",
  {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-API-Key": apiKey,
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({
      merchantAccount,
      amount: {
        currency: "USD",
        value: 1000,
      },
      reference,
      returnUrl: "http://localhost:5173/checkout/result",
      countryCode: "US",
      shopperLocale: "en-US",
      channel: "Web",
    }),
  },
);

const responseBody: unknown = await response.json();

if (!response.ok) {
  console.error("Adyen request failed.");
  console.error("HTTP status:", response.status);
  console.error("Response:", responseBody);
  process.exit(1);
}

if (
  typeof responseBody !== "object" ||
  responseBody === null ||
  !("id" in responseBody)
) {
  console.error("Adyen returned an unexpected successful response:");
  console.error(responseBody);
  process.exit(1);
}

console.log("Connected successfully to the Adyen Checkout API.");
console.log("HTTP status:", response.status);
console.log("Merchant reference:", reference);
console.log("Session ID:", responseBody.id);
console.log("No real payment was created.");
