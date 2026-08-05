# Fantasy War Room Commerce Lab

A standalone portfolio project demonstrating an Adyen Checkout Sessions integration for the fictional **Fantasy War Room 2026 Draft Pass**.

This project uses the Adyen **TEST environment only**. It does not process real payments, charge real cards, or grant product access.

## Stack

- Vite and vanilla TypeScript frontend
- Node.js, Express, and TypeScript backend
- Adyen Checkout API v72 Sessions flow
- Adyen Web Drop-in v6
- Official `@adyen/api-library` Node integration
- npm

## Prerequisites

- Node.js 20.19 or later
- npm
- An Adyen test account
- A test API credential with:
  - API key
  - Merchant account
  - Client key

## Configuration

Copy the environment template:

```bash
cp .env.example .env
```

Populate the local `.env` file with your Adyen TEST credentials:

```dotenv
ADYEN_API_KEY=
ADYEN_MERCHANT_ACCOUNT=
ADYEN_CLIENT_KEY=
```

The client key must begin with `test_`. API and HMAC keys must never be exposed to browser code.

In the Adyen test Customer Area, add the following allowed origin to the API credential associated with the client key:

```text
http://localhost:5173
```

Enable the test payment methods you want Drop-in to display.

## Installation

```bash
npm install
```

## Development

Start the Vite frontend and Express backend together:

```bash
npm run dev
```

The services run at:

- Frontend: `http://localhost:5173`
- Backend: `http://localhost:3000`

Vite proxies `/api` requests to the backend.

The services can also be started separately:

```bash
npm run dev:frontend
npm run dev:backend
```

## Checkout flow

1. The browser requests public Drop-in configuration from `GET /api/checkout/config`.
2. The browser sends an empty request to `POST /api/checkout/sessions`.
3. The server fixes the product and price at **Fantasy War Room 2026 Draft Pass — USD 10.00**.
4. The server generates a unique merchant reference and UUID idempotency key.
5. The backend creates a session through the Adyen TEST Checkout API.
6. The browser receives the session ID and encrypted session data, then mounts Adyen Web Drop-in.
7. Browser callbacks show the immediate TEST payment result. They do not grant premium access.

The API key and merchant account remain server-side. Card data is collected by Adyen Drop-in and is not stored by this project.

## Manual testing

Open `http://localhost:5173`, select **Begin TEST checkout**, and use an official Adyen test card. For example:

```text
Mastercard: 5555 5555 5555 4444
Expiry: 03/2030
CVC: 737
```

Test card details work only in Adyen's test environment. No real money is charged.

The existing connectivity check can create a TEST Checkout session directly:

```bash
npm run check:adyen
```

## Validation

Run the mocked automated tests:

```bash
npm test
```

Run strict TypeScript checks:

```bash
npm run typecheck
```

Create the production frontend build:

```bash
npm run build
```

Automated tests replace the Adyen session service with a fake and never call the real Adyen API.

## API endpoints

### `GET /api/checkout/config`

Returns browser-safe Drop-in configuration:

```json
{
  "environment": "test",
  "clientKey": "test_..."
}
```

### `POST /api/checkout/sessions`

Accepts an empty JSON object:

```json
{}
```

Product, currency, and amount are defined exclusively by the server. Requests containing browser-supplied checkout fields are rejected.

## Current limitations

- TEST environment only
- No webhooks or authoritative payment-state handling
- No authentication, database, entitlements, subscriptions, refunds, or deployment configuration
- Browser callbacks are informational and must not be treated as proof of entitlement
