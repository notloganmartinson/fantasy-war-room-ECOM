export interface ServerConfig {
  apiKey: string;
  merchantAccount: string;
  clientKey: string;
  returnUrl: string;
}

function requireEnvironmentVariable(
  environment: NodeJS.ProcessEnv,
  name: string,
): string {
  const value = environment[name]?.trim();

  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }

  return value;
}

export function loadServerConfig(
  environment: NodeJS.ProcessEnv = process.env,
): ServerConfig {
  const clientKey = requireEnvironmentVariable(environment, "ADYEN_CLIENT_KEY");

  if (!clientKey.startsWith("test_")) {
    throw new Error("ADYEN_CLIENT_KEY must be an Adyen TEST client key.");
  }

  return {
    apiKey: requireEnvironmentVariable(environment, "ADYEN_API_KEY"),
    merchantAccount: requireEnvironmentVariable(
      environment,
      "ADYEN_MERCHANT_ACCOUNT",
    ),
    clientKey,
    returnUrl: "http://localhost:5173/checkout/result",
  };
}
