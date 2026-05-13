import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentAppUser } from "@/lib/vendor-context";
import { verifyRazorpaySignature } from "@/lib/razorpay";

type VerifyBody = {
  appOrderId?: string;
  razorpayOrderId?: string;
  razorpayPaymentId?: string;
  razorpaySignature?: string;
};

export async function POST(request: Request) {
  try {
    const user = await getCurrentAppUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = (await request.json()) as VerifyBody;
    const appOrderId = body.appOrderId?.trim();
    const razorpayOrderId = body.razorpayOrderId?.trim();
    const razorpayPaymentId = body.razorpayPaymentId?.trim();
    const razorpaySignature = body.razorpaySignature?.trim();

    if (!appOrderId || !razorpayOrderId || !razorpayPaymentId || !razorpaySignature) {
      return NextResponse.json({ error: "Missing payment verification params" }, { status: 400 });
    }

    const isValid = verifyRazorpaySignature({
      razorpayOrderId,
      razorpayPaymentId,
      razorpaySignature,
    });

    if (!isValid) {
      return NextResponse.json({ error: "Invalid Razorpay signature" }, { status: 400 });
    }

    const order = await prisma.order.findFirst({
      where: {
        id: appOrderId,
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
      return NextResponse.json({
        ok: true,
        redirectTo: `/orders/${order.id}?placed=1`,
      });
    }

    await prisma.$transaction(async (tx) => {
      await tx.payment.update({
        where: { id: order.payment!.id },
        data: {
          status: "SUCCESS",
          stripePaymentId: razorpayPaymentId,
        },
      });

      await tx.order.update({
        where: { id: order.id },
        data: {
          paymentStatus: "SUCCESS",
          status: "CONFIRMED",
        },
      });

      const existingDelivery = await tx.delivery.findFirst({
        where: { orderId: order.id },
        select: { id: true },
      });

      if (!existingDelivery) {
        await tx.delivery.create({
          data: {
            orderId: order.id,
            status: "SEARCHING",
          },
        });
      }

      await tx.cartItem.deleteMany({
        where: { userId: user.id },
      });
    });

    return NextResponse.json({
      ok: true,
      redirectTo: `/orders/${order.id}?placed=1`,
    });
  } catch (error) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Failed to verify Razorpay payment",
      },
      { status: 500 },
    );
  }
}
