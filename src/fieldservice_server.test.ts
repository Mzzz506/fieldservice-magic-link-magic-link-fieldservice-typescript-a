import assert from "node:assert/strict";
import { workOrderBody } from "./fieldservice_server.ts";

const accepted = workOrderBody.safeParse({
  orderId: "WO-1042",
  customerEmail: "buyer@example.com",
  photos: [],
  dispatchStatus: "assigned",
  technicianFollowUp: "Call before arrival"
});
assert.equal(accepted.success, true);

const rejected = workOrderBody.safeParse({
  orderId: "WO-1042",
  customerEmail: "buyer@example.com",
  photos: [],
  dispatchStatus: "lost",
  technicianFollowUp: "Call before arrival"
});
assert.equal(rejected.success, false);
console.log("work-order dispatch decision test passed");
