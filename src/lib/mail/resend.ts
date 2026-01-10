import { Resend } from "resend";
import { env } from "../env";
import type { MailAdapter } from "./send-email";

// Use a dummy API key if none is provided (for CI/testing environments)
// Using || instead of ?? because RESEND_API_KEY can be an empty string "" in CI
// eslint-disable-next-line @typescript-eslint/prefer-nullish-coalescing
export const resend = new Resend(env.RESEND_API_KEY || "re_dummy_key_for_ci");

export const resendMailAdapter: MailAdapter = {
  send: async (params) => {
    const result = await resend.emails.send(params);

    if (result.error) {
      return { error: new Error(result.error.message), data: null };
    }

    return { error: null, data: { id: result.data.id } };
  },
};
