import { randomUUID } from "node:crypto";
import {
  CheckoutAPI,
  Client,
  EnvironmentEnum,
  Types,
} from "@adyen/api-library";

export const PRODUCT = {
  name: "Fantasy War Room 2026 Draft Pass",
  amount: {
    currency: "USD",
    value: 1000,
  },
} as const;

export interface CheckoutSession {
  id: string;
  sessionData: string;
  reference: string;
}

export interface CheckoutSessionService {
  createSession(): Promise<CheckoutSession>;
}

interface AdyenCheckoutOptions {
  apiKey: string;
  merchantAccount: string;
  returnUrl: string;
  createReference?: () => string;
  createIdempotencyKey?: () => string;
}

export class AdyenCheckoutSessionService implements CheckoutSessionService {
  readonly #checkoutApi: CheckoutAPI;
  readonly #merchantAccount: string;
  readonly #returnUrl: string;
  readonly #createReference: () => string;
  readonly #createIdempotencyKey: () => string;

  constructor(options: AdyenCheckoutOptions) {
    const client = new Client({
      apiKey: options.apiKey,
      environment: EnvironmentEnum.TEST,
    });

    this.#checkoutApi = new CheckoutAPI(client);
    this.#merchantAccount = options.merchantAccount;
    this.#returnUrl = options.returnUrl;
    this.#createReference =
      options.createReference ?? (() => `FWR-${Date.now()}-${randomUUID()}`);
    this.#createIdempotencyKey = options.createIdempotencyKey ?? randomUUID;
  }

  async createSession(): Promise<CheckoutSession> {
    const reference = this.#createReference();
    const request: Types.checkout.CreateCheckoutSessionRequest = {
      merchantAccount: this.#merchantAccount,
      amount: PRODUCT.amount,
      reference,
      returnUrl: this.#returnUrl,
      countryCode: "US",
      shopperLocale: "en-US",
      channel: Types.checkout.CreateCheckoutSessionRequest.ChannelEnum.Web,
      lineItems: [
        {
          id: "draft-pass-2026",
          description: PRODUCT.name,
          quantity: 1,
          amountIncludingTax: PRODUCT.amount.value,
        },
      ],
    };

    const response = await this.#checkoutApi.PaymentsApi.sessions(request, {
      idempotencyKey: this.#createIdempotencyKey(),
    });

    if (
      typeof response.id !== "string" ||
      response.id.length === 0 ||
      typeof response.sessionData !== "string" ||
      response.sessionData.length === 0
    ) {
      throw new Error("Adyen returned an invalid checkout session response.");
    }

    return {
      id: response.id,
      sessionData: response.sessionData,
      reference,
    };
  }
}
