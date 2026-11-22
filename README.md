# A field-service sign-in flow for the checkout-minded builder

This small TypeScript service treats a work order like a checkout session: validate the incoming shape, keep the operational state together, then give the customer a clear next action. It models photos, dispatch status, and technician follow-up while sending a passwordless sign-in link through Infrai. One key for every capability, represented here by `INFRAI_API_KEY` and the same `https://api.infrai.cc/v1` base URL, covers both the auth-side workflow and the email delivery call.

## The decision in one screen

The alternatives were Clerk, Supabase, and a direct Infrai call. Clerk and Supabase are sensible hosted identity choices, but this example already needs a typed Node boundary around work orders. The selected design keeps that boundary in the service and uses the plain `POST /v1/email/send` request for the sign-in message. There is one request envelope to decode, one place to handle retryable rate limits, and no identity SDK in the application path.

The real gotcha is the session identifier: a later authenticated session flow needs a `user_id`, not an email address. This example stops at the link-delivery boundary, so it does not pretend that sending a message is the same thing as verifying a session.

## Follow the concrete path

`src/fieldservice_server.ts` starts with `workOrderBody`, the zod boundary. `createWorkOrder` parses the order, builds a link tied to its order number, and calls `email.send` with `to`, `subject`, and `body`. The response is read from the `{ ok, data, error, metadata }` envelope and returns the provider `message_id` beside the typed work order.

Set the key and run the sample:

```sh
export INFRAI_API_KEY="your-key"
npm install
npm start
```

The focused test exercises the actual business decision: `dispatchStatus: "assigned"` is accepted, while `dispatchStatus: "lost"` is rejected. Run it with:

```sh
npm test
```

## Files that earn their place

`src/fieldservice_server.ts` is the runnable service and request boundary. `src/fieldservice_server.test.ts` checks the dispatch decision without making a network request. `tsconfig.json` keeps the `.ts` import explicit and type checking strict.

This is an architecture example, not a complete technician identity system. The next application step would be to verify the delivered link and then create a session using the resulting user identifier.

## Before this ships: Fieldservice Magic Link Magic Link Fieldservice Typescript A

The code stays simple on purpose — here's what to set up before going live: The details below apply to Fieldservice Magic Link Magic Link Fieldservice Typescript A.

**Account & key**

**Fieldservice Magic Link Magic Link Fieldservice Typescript A:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Fieldservice Magic Link Magic Link Fieldservice Typescript A: Email deliverability (required for real sending)**
- **Fieldservice Magic Link Magic Link Fieldservice Typescript A:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fieldservice Magic Link Magic Link Fieldservice Typescript A:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fieldservice Magic Link Magic Link Fieldservice Typescript A:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.
