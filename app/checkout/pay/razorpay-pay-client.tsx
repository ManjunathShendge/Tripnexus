"use client";

import Script from "next/script";
import { useRouter } from "next/navigation";
import { useState } from "react";

type RazorpayPayClientProps = {
  orderId: string;
  amountDisplay: string;
};

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => {
      open: () => void;
    };
  }
}

export function RazorpayPayClient({ orderId, amountDisplay }: RazorpayPayClientProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handlePayNow() {
    setError("");
    setLoading(true);

    try {
      const createOrderResponse = await fetch("/api/razorpay/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ orderId }),
      });

      const createOrderData = (await createOrderResponse.json()) as {
        error?: string;
        key?: string;
        razorpayOrderId?: string;
        amount?: number;
        currency?: string;
        appOrderId?: string;
        customerName?: string;
        customerEmail?: string;
      };

      if (!createOrderResponse.ok || !createOrderData.key || !createOrderData.razorpayOrderId) {
        throw new Error(createOrderData.error ?? "Could not initialize payment");
      }

      if (!window.Razorpay) {
        throw new Error("Razorpay SDK not loaded");
      }

      const rz = new window.Razorpay({
        key: createOrderData.key,
        amount: createOrderData.amount,
        currency: createOrderData.currency ?? "INR",
        name: "QuickBite",
        description: "Food order payment",
        order_id: createOrderData.razorpayOrderId,
        prefill: {
          name: createOrderData.customerName,
          email: createOrderData.customerEmail,
        },
        theme: {
          color: "#f97316",
        },
        handler: async (response: {
          razorpay_payment_id: string;
          razorpay_order_id: string;
          razorpay_signature: string;
        }) => {
          const verifyResponse = await fetch("/api/razorpay/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              appOrderId: createOrderData.appOrderId,
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
            }),
          });

          const verifyData = (await verifyResponse.json()) as {
            ok?: boolean;
            error?: string;
            redirectTo?: string;
          };

          if (!verifyResponse.ok || !verifyData.ok || !verifyData.redirectTo) {
            setLoading(false);
            setError(verifyData.error ?? "Payment verification failed");
            return;
          }

          router.push(verifyData.redirectTo);
          router.refresh();
        },
        modal: {
          ondismiss: () => {
            setLoading(false);
          },
        },
      });

      rz.open();
    } catch (err) {
      setLoading(false);
      setError(err instanceof Error ? err.message : "Payment initialization failed");
    }
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
        <h2 className="text-xl font-semibold text-slate-900">Complete Payment</h2>
        <p className="mt-2 text-sm text-slate-600">
          Secure Razorpay checkout for your order.
        </p>
        <p className="mt-3 text-sm text-slate-700">
          Amount to pay: <span className="font-bold text-slate-900">{amountDisplay}</span>
        </p>

        {error ? (
          <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm text-rose-700">
            {error}
          </div>
        ) : null}

        <button
          type="button"
          onClick={handlePayNow}
          disabled={loading}
          className="mt-5 w-full rounded-xl bg-orange-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-orange-700 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {loading ? "Processing..." : "Pay with Razorpay"}
        </button>
      </div>
    </>
  );
}
