# AGENTS.md

## Project purpose

This is a standalone portfolio and learning project demonstrating an Adyen
test Checkout integration for a fictional Fantasy War Room 2026 Draft Pass.

The project must use Adyen's TEST environment only. It must never process,
describe itself as processing, or be configured to process real payments.

## Current architecture

- Vite vanilla TypeScript frontend
- Node.js and Express TypeScript backend
- Adyen Checkout Sessions flow
- Adyen Web Drop-in
- npm for package management
- Environment variables stored locally in `.env`

The existing `server/src/check-adyen.ts` script has successfully created an
Adyen test session. Preserve it as a known-working reference until the browser
checkout works end to end.

## Security requirements

- Never print, display, summarize, modify, or commit `.env` contents.
- Commands may load `.env`, but do not use `cat`, `sed`, `grep`, or similar
  commands to reveal its values.
- Never expose `ADYEN_API_KEY` or `ADYEN_HMAC_KEY` to browser code.
- The Adyen client key may be returned to the browser because it is intended
  for client-side Drop-in use.
- Use environment variables for all credentials.
- Keep `.env.example` limited to empty placeholders.
- Never log complete credentials, payment-method data, or sensitive payloads.
- Do not store card data.
- Use the Adyen TEST API only.
- Before finishing, verify that `.env` remains ignored by Git.

## Scope control

Implement only the milestone explicitly requested in the current prompt.

Do not add any of the following unless the prompt specifically requests them:

- Live payments
- User authentication
- Rankings integrations
- Subscriptions
- Refund administration
- Production deployment
- AI features
- A database
- Webhooks
- Entitlements
- Unrelated UI features

Do not turn this focused integration lab into a general ecommerce application.

## Engineering expectations

- Inspect the repository before editing.
- Explain the proposed file changes before making them.
- Reuse the behavior proven by `check-adyen.ts` rather than replacing it
  without a reason.
- Use strict TypeScript.
- Validate external inputs and responses.
- Separate Adyen API access from Express route handling so it can be tested.
- Mock Adyen in automated tests. Tests must not call the real Adyen API.
- Return useful but non-sensitive errors to the frontend.
- Explain any new production dependency before installing it.
- Keep changes small and understandable.
- Run tests, type checking, and the production build after implementation.
- Do not commit changes.
- At completion, summarize the request flow, changed files, commands run,
  test results, and remaining limitations.
