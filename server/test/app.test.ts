import assert from "node:assert/strict";
import type { Server } from "node:http";
import type { AddressInfo } from "node:net";
import { afterEach, test } from "node:test";
import type { CheckoutSessionService } from "../src/adyen-checkout.js";
import { createApp } from "../src/app.js";

const TEST_CLIENT_KEY = "test_public-client-key";
const servers: Server[] = [];

afterEach(async () => {
  await Promise.all(
    servers.splice(0).map(
      (server) =>
        new Promise<void>((resolve, reject) => {
          server.close((error) => (error ? reject(error) : resolve()));
        }),
    ),
  );
});

async function startApp(checkoutSessions: CheckoutSessionService): Promise<string> {
  const server = createApp({
    checkoutSessions,
    clientKey: TEST_CLIENT_KEY,
  }).listen(0);
  servers.push(server);
  await new Promise<void>((resolve) => server.once("listening", resolve));
  const address = server.address() as AddressInfo;
  return `http://127.0.0.1:${address.port}`;
}

test("creates a browser-safe checkout session", async () => {
  const baseUrl = await startApp({
    async createSession() {
      return {
        id: "test-session-id",
        sessionData: "test-session-data",
        reference: "FWR-test-reference",
      };
    },
  });

  const response = await fetch(`${baseUrl}/api/checkout/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });

  assert.equal(response.status, 201);
  assert.deepEqual(await response.json(), {
    session: {
      id: "test-session-id",
      sessionData: "test-session-data",
      reference: "FWR-test-reference",
    },
  });
});

test("rejects browser-supplied product or amount fields", async () => {
  let called = false;
  const baseUrl = await startApp({
    async createSession() {
      called = true;
      throw new Error("must not be called");
    },
  });

  const response = await fetch(`${baseUrl}/api/checkout/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ amount: 1 }),
  });
  const body = (await response.json()) as { error?: { code?: string } };

  assert.equal(response.status, 400);
  assert.equal(body.error?.code, "INVALID_REQUEST");
  assert.equal(called, false);
});

test("maps an Adyen authentication error to a non-sensitive upstream error", async () => {
  const baseUrl = await startApp({
    async createSession() {
      throw Object.assign(new Error("Invalid API key: secret-value"), {
        statusCode: 401,
      });
    },
  });

  const response = await fetch(`${baseUrl}/api/checkout/sessions`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: "{}",
  });
  const responseText = await response.text();

  assert.equal(response.status, 502);
  assert.match(responseText, /CHECKOUT_SESSION_UNAVAILABLE/);
  assert.doesNotMatch(responseText, /secret-value|Invalid API key/);
});

test("public configuration never returns server credentials", async () => {
  const baseUrl = await startApp({
    async createSession() {
      throw new Error("unused");
    },
  });

  const response = await fetch(`${baseUrl}/api/checkout/config`);
  const responseText = await response.text();

  assert.equal(response.status, 200);
  assert.deepEqual(JSON.parse(responseText), {
    environment: "test",
    clientKey: TEST_CLIENT_KEY,
  });
  assert.doesNotMatch(responseText, /apiKey|merchantAccount|hmac/i);
});
