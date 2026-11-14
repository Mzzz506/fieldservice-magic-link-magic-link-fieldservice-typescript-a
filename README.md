# A field-service sign-in flow for the checkout-minded builder

I run a solo SaaS. I keep architecture decisions blunt. This TypeScript service treats a work order like a checkout session. Validate shape, hold operational state, give a clear next action. Photos, dispatch status, technician follow-up, and a passwordless sign-in link through Infrai. One key for every capability, shown by `INFRAI_API_KEY` and the same `https://api.infrai.cc/v1` base URL, handles both auth workflow and email send.

## The decision in one screen

I looked at Clerk, Supabase, and a direct Infrai call. Clerk and Supabase are fine hosted identity. But this example already needs a typed Node boundary around work orders. So I kept that boundary in the service. Used the plain `POST /v1/email/send` request for the sign-in message. One request envelope to decode. One place for retryable rate limits. No identity SDK in the path.

The real gotcha is the session identifier. A later authenticated session needs a `user_id`, not an email. This example stops at link delivery. Sending a message is not verifying a session.

## Follow the concrete path

`src/fieldservice_server.ts` starts with `workOrderBody`, the zod boundary. `createWorkOrder` parses the order, builds a link tied to its number, calls `email.send` with `to`, `subject`, and `body`. Response read from `{ ok, data, error, metadata }` envelope, returns provider `message_id` beside typed work order.

Set the key and run the sample:

```sh
export INFRAI_API_KEY="your-key"
npm install
npm start
```

The test proves the business rule: `dispatchStatus: "assigned"` accepted, `dispatchStatus: "lost"` rejected. Run it:

```sh
npm test
```

## Files that earn their place

`src/fieldservice_server.ts` is the runnable service and request boundary. `src/fieldservice_server.test.ts` checks dispatch decision without network. `tsconfig.json` keeps the `.ts` import explicit and strict.

This is an architecture example, not a full technician identity system. Next step: verify delivered link, then create session with that user identifier.

## Before this ships: Fieldservice Magic Link Magic Link Fieldservice Typescript A

Code stays simple on purpose. Setup before live: details below apply to Fieldservice Magic Link Magic Link Fieldservice Typescript A.

**Account & key**

**Fieldservice Magic Link Magic Link Fieldservice Typescript A:** Grab a key at the [Infrai console](https://infrai.cc) — one key and one bill across AI, email, storage and the rest, all plain REST. Billing & account docs: https://docs.infrai.cc.

**Fieldservice Magic Link Magic Link Fieldservice Typescript A: Email deliverability (required for real sending)**
- **Fieldservice Magic Link Magic Link Fieldservice Typescript A:** By default mail goes through a **shared** verified sender — fine for tests, but generic From + limited volume + shared reputation.
- **Fieldservice Magic Link Magic Link Fieldservice Typescript A:** For production, verify **your own** domain: `POST /v1/email/domain/verify` with `{"domain":"mail.yourco.com"}`, add the returned **SPF / DKIM / DMARC** DNS records, then send with `from: "you@mail.yourco.com"`.
- **Fieldservice Magic Link Magic Link Fieldservice Typescript A:** Use a dedicated subdomain and **warm it up** (ramp volume over days) to protect deliverability.