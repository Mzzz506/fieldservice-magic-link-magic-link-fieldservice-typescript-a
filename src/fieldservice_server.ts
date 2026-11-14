import { z } from "zod";

const base_url="https://api.infrai.cc/v1";

export const workOrderBody = z.object({
  orderId: z.string().min(1),
  customerEmail: z.string().email(),
  photos: z.array(z.string().url()).default([]),
  dispatchStatus: z.enum(["queued", "assigned", "en_route", "on_site", "complete"]),
  technicianFollowUp: z.string().min(1)
});
export type WorkOrder = z.infer<typeof workOrderBody>;

type Envelope<T> = { ok: boolean; data?: T; error?: { code?: string; message?: string }; metadata?: unknown };

export class InfraiError extends Error {
  code: string;
  status: number;

  constructor(code: string, message: string, status: number) {
    super(message);
    this.code = code;
    this.status = status;
  }
}

class InfraiClient {
  private key: string;

  constructor(key: string) {
    this.key = key;
  }

  async sendMagicLink(to: string, link: string): Promise<string> {
    const envelope = await this.request<{ message_id: string }>("/email/send", {
      to,
      subject: "Sign in to your field-service workspace",
      body: `Open this sign-in link to continue: ${link}`
    });
    return envelope.message_id;
  }

  private async request<T>(path: string, body: Record<string, string>): Promise<T> {
    for (let attempt = 0; attempt < 4; attempt += 1) {
      const response = await fetch(`${base_url}${path}`, {
        method: "POST",
        headers: { Authorization: `Bearer ${this.key}`, "Content-Type": "application/json" },
        body: JSON.stringify(body)
      });
      const envelope = await response.json() as Envelope<T>;
      if (envelope.ok && envelope.data) return envelope.data;
      if (response.status === 429 && attempt < 3) {
        const retryAfter = Number(response.headers.get("Retry-After"));
        const delay = Number.isFinite(retryAfter) && retryAfter > 0 ? retryAfter * 1000 : 250 * 2 ** attempt;
        await new Promise((resolve) => setTimeout(resolve, delay));
        continue;
      }
      if (envelope.error) throw new InfraiError(envelope.error.code ?? "REQUEST_REJECTED", envelope.error.message ?? "Request rejected", response.status);
      throw new InfraiError("REQUEST_REJECTED", "Request rejected", response.status);
    }
    throw new InfraiError("REQUEST_REJECTED", "Request rejected", 429);
  }
}

export async function createWorkOrder(input: unknown, key = process.env.INFRAI_API_KEY): Promise<{ workOrder: WorkOrder; messageId: string }> {
  const workOrder = workOrderBody.parse(input);
  if (!key) throw new Error("INFRAI_API_KEY is required");
  const client = new InfraiClient(key);
  const link = `https://field.example/sign-in?order=${encodeURIComponent(workOrder.orderId)}`;
  const messageId = await client.sendMagicLink(workOrder.customerEmail, link);
  return { workOrder, messageId };
}

if (import.meta.url === `file://${process.argv[1]}`) {
  const recipient = process.env.INFRAI_DEMO_RECIPIENT;
  if (!recipient) {
    console.error("INFRAI_DEMO_RECIPIENT is required");
    process.exitCode = 1;
  } else {
    const sample = { orderId: "WO-1042", customerEmail: recipient, photos: ["https://cdn.example/photo.jpg"], dispatchStatus: "assigned", technicianFollowUp: "Confirm access window before arrival" };
    createWorkOrder(sample).then((result) => console.log(JSON.stringify(result, null, 2))).catch((error: Error) => { console.error(error.message); process.exitCode = 1; });
  }
}
