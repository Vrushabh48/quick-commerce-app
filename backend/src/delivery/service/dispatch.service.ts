import { prisma } from "../../lib";

export async function assignRider(orderId: number) {
  // 1. Ensure order is eligible
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    select: { status: true },
  });

  if (!order || order.status !== "PREPARING") {
    throw new Error("Order not eligible for rider assignment");
  }

  // 2. Ensure no assignment already exists
  const existingAssignment = await prisma.deliveryAssignment.findUnique({
    where: { orderId },
  });

  if (existingAssignment) {
    return existingAssignment;
  }

  // 3. Fetch eligible riders (no DB mutation)
  const riders = await prisma.deliveryPartner.findMany({
    where: {
      isActive: true,
      isAvailable: true,
    },
    take: 10, // cap fan-out
  });

  if (riders.length === 0) {
    throw new Error("No riders available");
  }

  // 4. Send offers asynchronously
  for (const rider of riders) {
    sendRiderOffer({
      riderId: rider.id,
      orderId,
    });
  }

  // 5. Nothing is assigned yet
  return { status: "OFFERS_SENT", riders: riders.length };
}

function sendRiderOffer({
  riderId,
  orderId,
}: {
  riderId: number;
  orderId: number;
}) {
  // WebSocket / push / polling
  console.log(`Offer sent to rider ${riderId} for order ${orderId}`);
}