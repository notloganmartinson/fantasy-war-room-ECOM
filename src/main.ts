import { AdyenCheckout, Dropin } from "@adyen/adyen-web/auto";
import "@adyen/adyen-web/styles/adyen.css";
import {
  removeRedirectResult,
  renderCheckoutStatus,
  resetFailedCheckout,
} from "./checkout-ui";
import "./style.css";

interface PublicConfig {
  environment: "test";
  clientKey: string;
}

interface SessionResponse {
  session: {
    id: string;
    sessionData: string;
    reference: string;
  };
}

interface ErrorResponse {
  error?: {
    message?: string;
  };
}

function requireElement<T extends Element>(selector: string): T {
  const element = document.querySelector<T>(selector);

  if (!element) {
    throw new Error(`Required element was not found: ${selector}`);
  }

  return element;
}

const app = requireElement<HTMLDivElement>("#app");

app.innerHTML = `
  <main class="page-shell">
    <header class="site-header">
      <a class="brand" href="/" aria-label="Fantasy War Room home">
        <span class="brand-mark" aria-hidden="true">FWR</span>
        <span>Fantasy War Room</span>
      </a>
      <span class="test-badge">Adyen TEST</span>
    </header>

    <section class="product-layout" aria-labelledby="product-title">
      <div class="product-story">
        <p class="eyebrow">2026 Draft season</p>
        <h1 id="product-title">Build your board.<br />Own the room.</h1>
        <p class="lede">The Fantasy War Room 2026 Draft Pass is a fictional product created to demonstrate a secure Adyen test checkout.</p>

        <ul class="feature-list" aria-label="Draft Pass highlights">
          <li><span aria-hidden="true">01</span> One-time TEST checkout</li>
          <li><span aria-hidden="true">02</span> Adyen Web Drop-in</li>
          <li><span aria-hidden="true">03</span> No premium access is activated</li>
        </ul>
      </div>

      <aside class="purchase-card" aria-labelledby="purchase-title">
        <div class="card-visual" aria-hidden="true">
          <span>2026</span>
          <strong>Draft<br />Pass</strong>
          <small>TEST EDITION</small>
        </div>

        <div class="purchase-summary">
          <div>
            <p class="product-kicker">Digital pass · TEST only</p>
            <h2 id="purchase-title">Fantasy War Room 2026 Draft Pass</h2>
          </div>
          <p class="price"><span>$10</span><sup>.00 USD</sup></p>
        </div>

        <div id="checkout-status" class="status" role="status" aria-live="polite">
          <strong>Safe test checkout</strong>
          <span>Use an Adyen test card. No real money will be charged.</span>
        </div>

        <button id="checkout-button" class="checkout-button" type="button">
          Begin TEST checkout <span aria-hidden="true">→</span>
        </button>

        <div id="dropin-container" class="dropin-container" hidden></div>
      </aside>
    </section>

    <footer>
      <span>Portfolio integration lab</span>
      <span>Payments powered by Adyen TEST</span>
    </footer>
  </main>
`;

const checkoutButton = requireElement<HTMLButtonElement>("#checkout-button");
const status = requireElement<HTMLDivElement>("#checkout-status");
const dropinContainer = requireElement<HTMLDivElement>("#dropin-container");

let dropin: Dropin | undefined;
const SESSION_STORAGE_KEY = "fwr-adyen-test-session";

function logDeveloperError(context: string, error: unknown): void {
  const diagnostic =
    error instanceof Error
      ? { name: error.name, type: "Error" }
      : { name: "UnknownError", type: typeof error };

  console.error(context, diagnostic);
}

function clearRedirectResult(): void {
  window.history.replaceState(
    {},
    "",
    removeRedirectResult(window.location.href),
  );
}

function isPublicConfig(value: unknown): value is PublicConfig {
  return (
    typeof value === "object" &&
    value !== null &&
    "environment" in value &&
    value.environment === "test" &&
    "clientKey" in value &&
    typeof value.clientKey === "string" &&
    value.clientKey.startsWith("test_")
  );
}

function isSessionResponse(value: unknown): value is SessionResponse {
  if (typeof value !== "object" || value === null || !("session" in value)) {
    return false;
  }

  const session = value.session;
  return (
    typeof session === "object" &&
    session !== null &&
    "id" in session &&
    typeof session.id === "string" &&
    "sessionData" in session &&
    typeof session.sessionData === "string" &&
    "reference" in session &&
    typeof session.reference === "string"
  );
}

async function parseResponse(response: Response): Promise<unknown> {
  try {
    return await response.json();
  } catch {
    return undefined;
  }
}

async function configureCheckout(
  config: PublicConfig,
  sessionResponse: SessionResponse,
) {
  return AdyenCheckout({
    environment: config.environment,
    clientKey: config.clientKey,
    countryCode: "US",
    locale: "en-US",
    session: {
      id: sessionResponse.session.id,
      sessionData: sessionResponse.session.sessionData,
    },
    onPaymentCompleted(result) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      clearRedirectResult();
      renderCheckoutStatus(
        status,
        "success",
        "TEST payment completed",
        `Adyen reported ${result?.resultCode ?? "a completed result"}. No premium access was activated.`,
      );
    },
    onPaymentFailed(result) {
      sessionStorage.removeItem(SESSION_STORAGE_KEY);
      clearRedirectResult();
      renderCheckoutStatus(
        status,
        "error",
        "TEST payment was not completed",
        `Adyen reported ${result?.resultCode ?? "a failed result"}. You can reload and try another test card.`,
      );
    },
    onError(error) {
      logDeveloperError("Adyen checkout error", error);
      renderCheckoutStatus(
        status,
        "error",
        "Checkout error",
        error.name === "NETWORK_ERROR"
          ? "The TEST payment network could not be reached. Please try again."
          : "The TEST checkout could not continue. Please reload and try again.",
      );
    },
  });
}

async function beginCheckout(): Promise<void> {
  checkoutButton.disabled = true;
  renderCheckoutStatus(
    status,
    "loading",
    "Preparing secure checkout…",
    "Creating an Adyen TEST session.",
  );

  try {
    const [configResponse, sessionResponse] = await Promise.all([
      fetch("/api/checkout/config"),
      fetch("/api/checkout/sessions", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: "{}",
      }),
    ]);
    const [configBody, sessionBody] = await Promise.all([
      parseResponse(configResponse),
      parseResponse(sessionResponse),
    ]);

    if (!configResponse.ok || !isPublicConfig(configBody)) {
      throw new Error("The public TEST checkout configuration is unavailable.");
    }

    if (!sessionResponse.ok || !isSessionResponse(sessionBody)) {
      const message = (sessionBody as ErrorResponse | undefined)?.error?.message;
      throw new Error(message ?? "The TEST checkout session is unavailable.");
    }

    dropin?.unmount();
    dropinContainer.replaceChildren();
    dropinContainer.hidden = false;
    checkoutButton.hidden = true;
    sessionStorage.setItem(SESSION_STORAGE_KEY, JSON.stringify(sessionBody));

    const checkout = await configureCheckout(configBody, sessionBody);

    dropin = new Dropin(checkout, {
      paymentMethodsConfiguration: {
        card: {
          hasHolderName: true,
          holderNameRequired: true,
        },
      },
    });
    dropin.mount(dropinContainer);
    renderCheckoutStatus(
      status,
      "info",
      "Adyen TEST checkout ready",
      "Use an Adyen test card. No real money will be charged.",
    );
  } catch (error: unknown) {
    logDeveloperError("Checkout initialization failed", error);
    resetFailedCheckout(checkoutButton, dropinContainer, dropin);
    dropin = undefined;
    sessionStorage.removeItem(SESSION_STORAGE_KEY);
    renderCheckoutStatus(
      status,
      "error",
      "Unable to start checkout",
      "The TEST checkout could not be started. Please try again.",
    );
  }
}

async function resumeRedirectIfPresent(): Promise<void> {
  const redirectResult = new URLSearchParams(window.location.search).get("redirectResult");

  if (!redirectResult) {
    return;
  }

  checkoutButton.hidden = true;
  renderCheckoutStatus(
    status,
    "loading",
    "Completing TEST checkout…",
    "Validating the redirect result with Adyen.",
  );

  try {
    const storedValue = sessionStorage.getItem(SESSION_STORAGE_KEY);
    const storedSession: unknown = storedValue ? JSON.parse(storedValue) : undefined;
    const configResponse = await fetch("/api/checkout/config");
    const configBody = await parseResponse(configResponse);

    if (!isSessionResponse(storedSession) || !configResponse.ok || !isPublicConfig(configBody)) {
      throw new Error("The original TEST checkout session is no longer available.");
    }

    const checkout = await configureCheckout(configBody, storedSession);
    checkout.submitDetails({ details: { redirectResult } });
  } catch (error: unknown) {
    logDeveloperError("Redirect completion failed", error);
    renderCheckoutStatus(
      status,
      "error",
      "Unable to complete checkout",
      "The TEST checkout could not be completed. Reload to retry.",
    );
    checkoutButton.hidden = false;
    checkoutButton.disabled = false;
  }
}

checkoutButton.addEventListener("click", () => {
  void beginCheckout();
});

void resumeRedirectIfPresent();
