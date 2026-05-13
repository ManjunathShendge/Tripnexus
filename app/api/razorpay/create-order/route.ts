import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";
import { createRazorpayOrder, getRazorpayPublicKey } from "@/lib/razorpay";

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as { orderId?: string };
    const orderId = body.orderId?.trim();
    if (!orderId) {
      return NextResponse.json({ error: "Missing orderId" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: orderId,
        userId: user.id,
      },
      include: {
        payment: true,
      },
    });

    if (!order || !order.payment) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    if (order.payment.status === "SUCCESS" || order.paymentStatus === "SUCCESS") {
      return NextResponse.json(
        { error: "Order is already paid", redirectTo: `/orders/${order.id}` },
        { status: 409 },
      );
    }

    if (order.paymentMethod === "CASH") {
      return NextResponse.json(
        { error: "Razorpay not required for cash orders" },
        { status: 400 },
      );
    }

    const amountInPaise = Math.round(order.grandTotal * 100);
    const razorOrder = await createRazorpayOrder({
      amountInPaise,
      receipt: order.orderNumber.slice(0, 40),
      notes: {
        app_order_id: order.id,
        app_user_id: user.id,
      },
    });

    return NextResponse.json({
      key: getRazorpayPublicKey(),
      razorpayOrderId: razorOrder.id,
      amount: razorOrder.amount,
      currency: razorOrder.currency,
      appOrderId: order.id,
      customerEmail: user.email,
      customerName: user.name ?? user.email,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to create Razorpay order",
      },
      { status: 500 },
    );
  }
}
