import { prisma } from "@/lib/db";
import { resolveOrderKanteiCodeSafe } from "@/lib/order/kanteiCode";
import {
  authorizeOrderIdUnderValueAuthority,
  shouldUseOrderIdentityRead,
} from "@/lib/value/orderIdentityAuthority";
import { resolveValueIdentityOwnership } from "@/lib/value/valueIdentityOwnership";

export type CreateKanteiBookBindingRequestInput = {
  orderId: string;
  viewerEmail: string;
};

export async function createOrReusePendingKanteiBookBindingRequest(
  input: CreateKanteiBookBindingRequestInput,
) {
  const order = await prisma.order.findUnique({ where: { id: input.orderId } });
  if (!order) return { ok: false as const, error: "鑑定が見つかりません。" };

  if (shouldUseOrderIdentityRead()) {
    const ownership = await resolveValueIdentityOwnership();
    const authz = await authorizeOrderIdUnderValueAuthority({
      orderId: order.id,
      ownership,
    });
    if (!authz.ok) {
      return { ok: false as const, error: "この鑑定へのアクセス権がありません。" };
    }
  } else if (order.email.toLowerCase() !== input.viewerEmail.toLowerCase()) {
    return { ok: false as const, error: "この鑑定へのアクセス権がありません。" };
  }

  const kanteiCode =
    order.kanteiCode ?? (await resolveOrderKanteiCodeSafe(order.id, "book-binding-request"));
  if (!kanteiCode) {
    return { ok: false as const, error: "鑑定コードを取得できませんでした。しばらくしてからお試しください。" };
  }

  const existing = await prisma.kanteiBookBindingRequest.findFirst({
    where: {
      orderId: order.id,
      email: order.email,
      status: "pending",
    },
    orderBy: { createdAt: "desc" },
  });

  if (existing) {
    return { ok: true as const, requestId: existing.id, reused: true };
  }

  const created = await prisma.kanteiBookBindingRequest.create({
    data: {
      orderId: order.id,
      email: order.email,
      profileId: order.profileId,
      status: "pending",
      kanteiCode,
      fullNameDisplay: order.fullNameDisplay,
      birthDate: order.birthDate,
      orderCreatedAt: order.createdAt,
    },
  });

  return { ok: true as const, requestId: created.id, reused: false };
}
