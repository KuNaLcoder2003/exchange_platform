/**
 * OrderEntryForm.tsx
 * -----------------------------------------------------------------------
 * The side panel used to place an order. Captures exactly the fields your
 * API expects:
 *
 *   { quantity: number, price?: number, side: "BUY" | "SELL", type: "LIMIT_ORDER" | "MARKET_ORDER" }
 *
 * `price` is omitted from the submitted payload for MARKET_ORDER, since a
 * market order executes at the best available price rather than one you set.
 * -----------------------------------------------------------------------
 */

import React, { useState } from "react";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

export type OrderSide = "BUY" | "SELL";
export type OrderType = "LIMIT_ORDER" | "MARKET_ORDER";

export interface PlaceOrderPayload {
    quantity: number;
    price?: number;
    side: OrderSide;
    type: OrderType;
}

interface OrderEntryFormProps {
    pair?: string;
    /** Current mark price, used to prefill the limit price and to price market orders. */
    marketPrice?: number;
    /** Available balance for quick %-of-balance buttons — purely cosmetic unless you wire it up. */
    availableBalance?: number;
    onSubmit?: (order: PlaceOrderPayload) => void | Promise<void>;
}

const QUICK_PERCENTAGES = [25, 50, 75, 100];

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

const OrderEntryForm: React.FC<OrderEntryFormProps> = ({
    pair = "SOL/USDC",
    marketPrice = 169.55,
    availableBalance = 4820.11,
    onSubmit,
}) => {
    const [side, setSide] = useState<OrderSide>("BUY");
    const [type, setType] = useState<OrderType>("LIMIT_ORDER");
    const [price, setPrice] = useState(marketPrice.toString());
    const [quantity, setQuantity] = useState("");
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [base, quote] = pair.split("/");

    const effectivePrice = type === "MARKET_ORDER" ? marketPrice : parseFloat(price) || 0;
    const parsedQuantity = parseFloat(quantity) || 0;
    const total = effectivePrice * parsedQuantity;

    const canSubmit = parsedQuantity > 0 && (type === "MARKET_ORDER" || effectivePrice > 0);

    const applyPercentage = (pct: number) => {
        if (effectivePrice <= 0) return;
        const spend = (availableBalance * pct) / 100;
        setQuantity((spend / effectivePrice).toFixed(4));
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!canSubmit) {
            setError("Enter a quantity" + (type === "LIMIT_ORDER" ? " and price" : "") + ".");
            return;
        }
        setError(null);

        const payload: PlaceOrderPayload = {
            quantity: parsedQuantity,
            side,
            type,
            ...(type === "LIMIT_ORDER" ? { price: parseFloat(price) } : {}),
        };

        setSubmitting(true);
        try {
            await onSubmit?.(payload);
        } finally {
            setSubmitting(false);
        }
    };

    const buyActive = side === "BUY";

    return (
        <div className="flex w-full flex-col rounded-2xl border border-white/10 bg-[#0f0f13] font-body text-white">
            {/* side tabs */}
            <div className="grid grid-cols-2 gap-1 p-2">
                <button
                    type="button"
                    onClick={() => setSide("BUY")}
                    className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${buyActive ? "bg-emerald-500 text-[#0a0a0d]" : "bg-white/[0.04] text-white/50 hover:text-white/80"
                        }`}
                >
                    Buy
                </button>
                <button
                    type="button"
                    onClick={() => setSide("SELL")}
                    className={`rounded-xl py-2.5 text-sm font-semibold transition-colors ${!buyActive ? "bg-rose-500 text-[#0a0a0d]" : "bg-white/[0.04] text-white/50 hover:text-white/80"
                        }`}
                >
                    Sell
                </button>
            </div>

            {/* order type tabs */}
            <div className="flex gap-4 border-b border-white/10 px-4 pb-3">
                {(["LIMIT_ORDER", "MARKET_ORDER"] as OrderType[]).map((t) => (
                    <button
                        key={t}
                        type="button"
                        onClick={() => setType(t)}
                        className={`font-body text-sm font-medium transition-colors ${type === t ? "text-white" : "text-white/40 hover:text-white/70"
                            }`}
                    >
                        {t === "LIMIT_ORDER" ? "Limit" : "Market"}
                    </button>
                ))}
            </div>

            <form onSubmit={handleSubmit} className="flex flex-1 flex-col gap-4 p-4">
                {/* price */}
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="order-price" className="font-body text-xs font-medium text-white/50">
                            Price
                        </label>
                        <span className="font-body text-xs text-white/30">{quote}</span>
                    </div>
                    <input
                        id="order-price"
                        type="number"
                        step="0.01"
                        min="0"
                        disabled={type === "MARKET_ORDER"}
                        value={type === "MARKET_ORDER" ? marketPrice.toFixed(2) : price}
                        onChange={(e) => setPrice(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 font-body text-sm text-white tabular-nums outline-none transition-colors focus:border-[#ff7a45]/50 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:text-white/40"
                    />
                    {type === "MARKET_ORDER" && (
                        <p className="mt-1 font-body text-[11px] text-white/30">Executes at best available price.</p>
                    )}
                </div>

                {/* quantity */}
                <div>
                    <div className="mb-1.5 flex items-center justify-between">
                        <label htmlFor="order-quantity" className="font-body text-xs font-medium text-white/50">
                            Quantity
                        </label>
                        <span className="font-body text-xs text-white/30">{base}</span>
                    </div>
                    <input
                        id="order-quantity"
                        type="number"
                        step="0.0001"
                        min="0"
                        value={quantity}
                        onChange={(e) => setQuantity(e.target.value)}
                        placeholder="0.00"
                        className="w-full rounded-xl border border-white/10 bg-white/[0.04] px-3.5 py-2.5 font-body text-sm text-white tabular-nums outline-none transition-colors focus:border-[#ff7a45]/50 focus:bg-white/[0.06]"
                    />

                    <div className="mt-2 grid grid-cols-4 gap-1.5">
                        {QUICK_PERCENTAGES.map((pct) => (
                            <button
                                key={pct}
                                type="button"
                                onClick={() => applyPercentage(pct)}
                                className="rounded-lg border border-white/10 bg-white/[0.03] py-1 font-body text-[11px] text-white/50 transition-colors hover:border-white/25 hover:text-white/80"
                            >
                                {pct}%
                            </button>
                        ))}
                    </div>
                </div>

                {/* summary */}
                <div className="space-y-1.5 rounded-xl border border-white/5 bg-white/[0.02] px-3.5 py-3">
                    <div className="flex items-center justify-between font-body text-xs text-white/40">
                        <span>Order value</span>
                        <span className="tabular-nums text-white/70">
                            {total > 0 ? total.toLocaleString(undefined, { maximumFractionDigits: 2 }) : "0.00"} {quote}
                        </span>
                    </div>
                    <div className="flex items-center justify-between font-body text-xs text-white/40">
                        <span>Available</span>
                        <span className="tabular-nums text-white/70">
                            {availableBalance.toLocaleString(undefined, { maximumFractionDigits: 2 })} {quote}
                        </span>
                    </div>
                </div>

                {error && <p className="font-body text-xs text-rose-400">{error}</p>}

                <button
                    type="submit"
                    disabled={!canSubmit || submitting}
                    className={`mt-auto rounded-xl py-3 font-body text-sm font-semibold transition-transform hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 disabled:hover:scale-100 ${buyActive ? "bg-emerald-500 text-[#0a0a0d]" : "bg-rose-500 text-[#0a0a0d]"
                        }`}
                >
                    {submitting ? "Placing order…" : `${buyActive ? "Buy" : "Sell"} ${base}`}
                </button>
            </form>
        </div>
    );
};

export default OrderEntryForm;