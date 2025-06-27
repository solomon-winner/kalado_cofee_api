import {
  PayPalHttpClient,
  LiveEnvironment,
  SandboxEnvironment,
} from "@paypal/checkout-server-sdk";

/**
 * Creates and returns a PayPal HTTP client instance
 * using either Sandbox or Live environment based on STRAPI_ENV.
 */
export const paypalClient = (): PayPalHttpClient => {
  const clientId = process.env.PAYPAL_CLIENT_ID;
  const clientSecret = process.env.PAYPAL_CLIENT_SECRET;

  if (!clientId || !clientSecret) {
    throw new Error("Missing PayPal client ID or secret in environment variables.");
  }

  const environment =
    process.env.STRAPI_ENV === "production"
      ? new LiveEnvironment(clientId, clientSecret)
      : new SandboxEnvironment(clientId, clientSecret);

  return new PayPalHttpClient(environment);
};
