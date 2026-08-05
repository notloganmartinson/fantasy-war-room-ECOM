import "dotenv/config";
import { AdyenCheckoutSessionService } from "./adyen-checkout.js";
import { createApp } from "./app.js";
import { loadServerConfig } from "./config.js";

const PORT = 3000;
const config = loadServerConfig();
const checkoutSessions = new AdyenCheckoutSessionService(config);
const app = createApp({ checkoutSessions, clientKey: config.clientKey });

app.listen(PORT, () => {
  console.log(`Adyen TEST checkout server listening on http://localhost:${PORT}`);
});
