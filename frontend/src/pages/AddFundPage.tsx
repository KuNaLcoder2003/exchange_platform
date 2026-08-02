import React, { useState } from "react";
import toast, { Toaster } from "react-hot-toast";

import { loadStripe, type Appearance } from "@stripe/stripe-js";
import {
    Elements,
    PaymentElement,
    useElements,
    useStripe,
} from "@stripe/react-stripe-js";

const stripePromise = loadStripe(
    import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY
);

const ENDPOINT = "http://localhost:3000/api/v1/wallet/add";

const appearance: Appearance = {
    theme: "stripe",
    variables: {
        colorPrimary: "#6366f1",
        colorBackground: "#ffffff",
        colorText: "#1f2937",
        colorTextSecondary: "#6b7280",
        colorDanger: "#ef4444",
        fontFamily: "Inter, system-ui, sans-serif",
        spacingUnit: "4px",
        borderRadius: "8px",
    },
    rules: {
        ".Input": {
            border: "1px solid #e5e7eb",
            boxShadow: "none",
            padding: "12px",
        },
        ".Input:focus": {
            border: "1px solid #6366f1",
            boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
        },
        ".Label": {
            fontWeight: "500",
            marginBottom: "6px",
        },
        ".Tab": {
            border: "1px solid #e5e7eb",
            borderRadius: "8px",
        },
        ".Tab--selected": {
            border: "1px solid #6366f1",
            boxShadow: "0 0 0 3px rgba(99,102,241,0.15)",
        },
    },
};

export default function PaymentsPage() {
    const [clientSecret, setClientSecret] = useState<string | null>(null);

    if (!clientSecret) {
        return <CreatePayment setClientSecret={setClientSecret} />;
    }

    return (
        <Elements
            stripe={stripePromise}
            options={{
                clientSecret,
                appearance,
            }}
        >
            <Checkout />
        </Elements>
    );
}

function CreatePayment({
    setClientSecret,
}: {
    setClientSecret: React.Dispatch<React.SetStateAction<string | null>>;
}) {
    const [amount, setAmount] = useState("");
    const [loading, setLoading] = useState(false);

    async function createIntent() {
        const value = Number(amount);

        if (!value || value <= 0) {
            toast.error("Invalid amount");
            return;
        }

        setLoading(true);

        try {
            const res = await fetch(ENDPOINT, {
                method: "POST",
                credentials: "include",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    amount: value,
                }),
            });

            const data = await res.json();

            if (!data.valid) {
                toast.error(data.message);
                return;
            }

            setClientSecret(data.client_secret);
        } catch (err) {
            console.error(err);
            toast.error("Something went wrong. Please try again.");
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
            <Toaster />
            <div className="w-full max-w-sm bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                <h1 className="text-lg font-semibold text-gray-900 mb-1">
                    Add money to wallet
                </h1>
                <p className="text-sm text-gray-500 mb-6">
                    Enter an amount to top up your balance.
                </p>

                <label
                    htmlFor="amount"
                    className="block text-sm font-medium text-gray-700 mb-1"
                >
                    Amount (USD)
                </label>
                <div className="relative mb-6">
                    <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm">
                        $
                    </span>
                    <input
                        id="amount"
                        type="number"
                        min="1"
                        step="0.01"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="0.00"
                        className="w-full pl-7 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                    />
                </div>

                <button
                    disabled={loading}
                    onClick={createIntent}
                    className="w-full py-2.5 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                >
                    {loading && (
                        <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                    )}
                    {loading ? "Creating..." : "Continue"}
                </button>
            </div>
        </div>
    );
}

function Checkout() {
    const stripe = useStripe();
    const elements = useElements();

    const [loading, setLoading] = useState(false);
    const [elementsReady, setElementsReady] = useState(false);

    async function pay() {
        if (!stripe || !elements) return;

        setLoading(true);

        try {
            const { error } = await stripe.confirmPayment({
                elements,
                confirmParams: {
                    return_url: "http://localhost:5173/payment-complete",
                },
            });

            if (error) {
                toast.error(error.message ?? "Payment failed");
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
            <Toaster />
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    <div className="mb-6">
                        <h1 className="text-lg font-semibold text-gray-900">
                            Payment details
                        </h1>
                        <p className="text-sm text-gray-500 mt-1">
                            Enter your card information to complete the top-up.
                        </p>
                    </div>

                    {!elementsReady && (
                        <div className="space-y-3 mb-2 animate-pulse">
                            <div className="h-10 bg-gray-100 rounded-lg" />
                            <div className="h-10 bg-gray-100 rounded-lg w-2/3" />
                        </div>
                    )}

                    <div className={elementsReady ? "block" : "hidden"}>
                        <PaymentElement
                            options={{ layout: "tabs" }}
                            onReady={() => setElementsReady(true)}
                        />
                    </div>

                    <button
                        disabled={loading || !stripe || !elementsReady}
                        onClick={pay}
                        className="w-full mt-6 py-3 rounded-lg bg-indigo-600 text-white font-medium text-sm hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2"
                    >
                        {loading && (
                            <span className="h-4 w-4 border-2 border-white/40 border-t-white rounded-full animate-spin" />
                        )}
                        {loading ? "Processing..." : "Pay now"}
                    </button>
                </div>

                <p className="text-center text-xs text-gray-400 mt-4">
                    Payments are securely processed by Stripe.
                </p>
            </div>
        </div>
    );
}