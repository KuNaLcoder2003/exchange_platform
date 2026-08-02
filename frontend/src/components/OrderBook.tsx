/**
 * OrderBook.tsx
 * -----------------------------------------------------------------------
 * A modern, single-column order book — asks stacked above bids, cumulative
 * depth bars, live spread row — in the same Vaultline dark/copper theme as
 * the rest of the app. Built with React + TypeScript + Tailwind CSS.
 *
 * SETUP — same as the other components in this project:
 * 1) Tailwind v3+ installed, Bricolage Grotesque / Instrument Sans fonts
 *    linked in index.html (see LandingPage.tsx header comment).
 * 2) Drop <OrderBook /> anywhere, or pass your own `orders` prop:
 *
 *    <OrderBook orders={liveOrders} pair="SOL/USDC" />
 * -----------------------------------------------------------------------
 */

import React, { useEffect, useMemo, useState } from "react";

// ---------------------------------------------------------------------------
// Types — mirrors the backend order shape
// ---------------------------------------------------------------------------

export type OrderStatus = "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";

export type Order = {
    id: string;
    idempotency_key: string;
    status: OrderStatus;
    quantity: string;
    remaining_quantity: string;
    price: string;
    side: "SELL" | "BUY";
    type: "LIMIT_ORDER" | "MARKET_ORDER";
    created_at: Date;
    updated_at: Date;
    user_id: string;
};

export type ConnectionStatus = "connecting" | "open" | "closed" | "error";

interface OrderBookProps {
    orders?: Order[];
    pair?: string;
    /** Currency symbol prefix for price. Defaults to ₹ to match the source snippet. */
    currency?: string;
    /** When provided, shows a small live-connection dot next to the title. */
    connectionStatus?: ConnectionStatus;
}

interface DepthRow {
    price: number;
    quantity: number;
    total: number;
    depthPct: number;
}

type Grouping = "0.01" | "0.1" | "1";

// ---------------------------------------------------------------------------
// Mock data (used when no `orders` prop is passed)
// ---------------------------------------------------------------------------

// const now = new Date();

// function mockOrder(
//     id: string,
//     side: "BUY" | "SELL",
//     price: number,
//     quantity: number,
//     remaining = quantity
// ): Order {
//     return {
//         id,
//         idempotency_key: `idem_${id}`,
//         status: remaining < quantity ? "PARTIALLY_FILLED" : "PENDING",
//         quantity: quantity.toString(),
//         remaining_quantity: remaining.toString(),
//         price: price.toString(),
//         side,
//         type: "LIMIT_ORDER",
//         created_at: now,
//         updated_at: now,
//         user_id: "user_mock",
//     };
// }


// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const fmtPrice = (n: number) => n.toFixed(2);
const fmtQty = (n: number) => n.toFixed(2);

/** Orders that actually rest on the book: open limit orders with quantity left. */
const isResting = (o: Order) =>
    o.type === "LIMIT_ORDER" && (o.status === "PENDING" || o.status === "PARTIALLY_FILLED");

/** Aggregates resting orders on one side into price levels, sorted and running-summed. */
function buildDepth(rows: Order[], side: "BUY" | "SELL", ascending: boolean): DepthRow[] {
    const byPrice = new Map<number, number>();
    for (const o of rows) {
        if (!isResting(o) || o.side !== side) continue;
        const price = parseFloat(o.price);
        const remaining = parseFloat(o.remaining_quantity);
        if (Number.isNaN(price) || Number.isNaN(remaining) || remaining <= 0) continue;
        byPrice.set(price, (byPrice.get(price) ?? 0) + remaining);
    }

    const levels = Array.from(byPrice.entries())
        .map(([price, quantity]) => ({ price, quantity }))
        .sort((a, b) => (ascending ? a.price - b.price : b.price - a.price));

    let running = 0;
    const withTotals = levels.map((l) => {
        running += l.quantity;
        return { price: l.price, quantity: l.quantity, total: running };
    });
    const max = withTotals.length ? withTotals[withTotals.length - 1].total : 1;
    return withTotals.map((r) => ({ ...r, depthPct: (r.total / max) * 100 }));
}

// ---------------------------------------------------------------------------
// Row components
// ---------------------------------------------------------------------------

const AskRow: React.FC<{ row: DepthRow; currency: string }> = ({ row, currency }) => (
    <div className="relative grid grid-cols-3 px-4 py-1 font-body text-[13px] tabular-nums">
        <div
            className="pointer-events-none absolute inset-y-0 right-0 bg-rose-500/10"
            style={{ width: `${row.depthPct}%` }}
        />
        <span className="relative z-10 text-rose-400">{fmtPrice(row.price)}</span>
        <span className="relative z-10 text-right text-white/70">{fmtQty(row.quantity)}</span>
        <span className="relative z-10 text-right text-white/40">
            {currency}
            {(row.total * row.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
    </div>
);

const BidRow: React.FC<{ row: DepthRow; currency: string }> = ({ row, currency }) => (
    <div className="relative grid grid-cols-3 px-4 py-1 font-body text-[13px] tabular-nums">
        <div
            className="pointer-events-none absolute inset-y-0 right-0 bg-emerald-500/10"
            style={{ width: `${row.depthPct}%` }}
        />
        <span className="relative z-10 text-emerald-400">{fmtPrice(row.price)}</span>
        <span className="relative z-10 text-right text-white/70">{fmtQty(row.quantity)}</span>
        <span className="relative z-10 text-right text-white/40">
            {currency}
            {(row.total * row.price).toLocaleString(undefined, { maximumFractionDigits: 0 })}
        </span>
    </div>
);

// ---------------------------------------------------------------------------
// Root component
// ---------------------------------------------------------------------------

const GROUPINGS: Grouping[] = ["0.01", "0.1", "1"];

const OrderBook: React.FC<OrderBookProps> = ({
    pair = "SOL/USDC",
    currency = "\u20B9",
    connectionStatus,
}) => {
    const [grouping, setGrouping] = useState<Grouping>("0.01");
    const [view, setView] = useState<"both" | "asks" | "bids">("both");

    const [orders, setOrders] = useState<Order[]>([])
    const [socket, setSocket] = useState<WebSocket | null>(null)



    useEffect(() => {
        const socket = new WebSocket('ws://localhost:8080')

        socket.onopen = () => {
            setSocket(socket)
        }

        socket.onmessage = (message) => {
            const data = JSON.parse(message.data)
            if (data.length == 0) {
                setOrders([])
            } else {
                setOrders(data)
            }
        }

        return () => {
            socket.close()
        }
    }, [])
    const asks = useMemo(
        () => buildDepth(orders, "SELL", true).slice(0, 8).reverse(),
        [orders]
    );
    const bids = useMemo(
        () => buildDepth(orders, "BUY", false).slice(0, 8),
        [orders]
    );

    const bestAsk = asks[asks.length - 1]?.price ?? 0;
    const bestBid = bids[0]?.price ?? 0;
    const spread = bestAsk - bestBid;
    const spreadPct = bestBid ? (spread / bestBid) * 100 : 0;
    const lastUp = bestBid >= (bids[1]?.price ?? bestBid);

    if (!socket) {
        return <div>Loading...</div>
    }

    return (
        <div className="w-full max-w-sm rounded-2xl border border-white/10 bg-[#0f0f13] font-body text-white">
            {/* header */}
            <div className="flex items-center justify-between border-b border-white/10 px-4 py-3">
                <div>
                    <div className="flex items-center gap-1.5">
                        <h3 className="font-display text-sm font-semibold text-white">Order book</h3>
                        {connectionStatus && (
                            <span
                                className={`h-1.5 w-1.5 rounded-full ${connectionStatus === "open"
                                    ? "bg-emerald-400"
                                    : connectionStatus === "connecting"
                                        ? "animate-pulse bg-[#ff7a45]"
                                        : "bg-white/25"
                                    }`}
                                aria-label={`Connection ${connectionStatus}`}
                            />
                        )}
                    </div>
                    <p className="text-xs text-white/40">{pair}</p>
                </div>

                <div className="flex items-center gap-1 rounded-lg border border-white/10 bg-white/5 p-0.5">
                    {(["both", "asks", "bids"] as const).map((v) => (
                        <button
                            key={v}
                            onClick={() => setView(v)}
                            aria-label={`Show ${v}`}
                            className={`flex h-6 w-7 items-center justify-center rounded-md transition-colors ${view === v ? "bg-white/10" : "hover:bg-white/5"
                                }`}
                        >
                            {v === "both" && (
                                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                                    <rect y="1" width="16" height="6" rx="1" fill="#fb7185" fillOpacity="0.7" />
                                    <rect y="9" width="16" height="6" rx="1" fill="#34d399" fillOpacity="0.7" />
                                </svg>
                            )}
                            {v === "asks" && (
                                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                                    <rect y="2" width="16" height="3" rx="1" fill="#fb7185" fillOpacity="0.85" />
                                    <rect y="7" width="16" height="3" rx="1" fill="#fb7185" fillOpacity="0.5" />
                                    <rect y="12" width="16" height="3" rx="1" fill="#fb7185" fillOpacity="0.25" />
                                </svg>
                            )}
                            {v === "bids" && (
                                <svg viewBox="0 0 16 16" className="h-3.5 w-3.5">
                                    <rect y="2" width="16" height="3" rx="1" fill="#34d399" fillOpacity="0.25" />
                                    <rect y="7" width="16" height="3" rx="1" fill="#34d399" fillOpacity="0.5" />
                                    <rect y="12" width="16" height="3" rx="1" fill="#34d399" fillOpacity="0.85" />
                                </svg>
                            )}
                        </button>
                    ))}
                </div>
            </div>

            {/* grouping selector */}
            <div className="flex items-center justify-between px-4 py-2">
                <div className="flex gap-1">
                    {GROUPINGS.map((g) => (
                        <button
                            key={g}
                            onClick={() => setGrouping(g)}
                            className={`rounded-md px-2 py-0.5 font-body text-[11px] tabular-nums transition-colors ${grouping === g
                                ? "bg-[#ff7a45]/15 text-[#ff7a45]"
                                : "text-white/40 hover:bg-white/5 hover:text-white/70"
                                }`}
                        >
                            {g}
                        </button>
                    ))}
                </div>
                <span className="font-body text-[11px] text-white/30">grouping</span>
            </div>

            {/* column labels */}
            <div className="grid grid-cols-3 px-4 py-1.5 font-body text-[11px] text-white/40">
                <span>Price</span>
                <span className="text-right">Size</span>
                <span className="text-right">Total</span>
            </div>

            {/* asks */}
            {view !== "bids" && (
                <div className="flex flex-col-reverse">
                    {asks.map((row) => (
                        <AskRow key={row.price} row={row} currency={currency} />
                    ))}
                </div>
            )}

            {/* spread */}
            <div className="flex items-center justify-between border-y border-white/10 bg-white/[0.03] px-4 py-2.5">
                <div className="flex items-baseline gap-2">
                    <span className={`font-display text-lg font-semibold tabular-nums ${lastUp ? "text-emerald-400" : "text-rose-400"}`}>
                        {fmtPrice(bestBid)}
                    </span>
                    <svg
                        viewBox="0 0 24 24"
                        fill="none"
                        className={`h-3 w-3 ${lastUp ? "text-emerald-400" : "text-rose-400 rotate-180"}`}
                    >
                        <path d="M12 5v14M12 5l-6 6M12 5l6 6" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </div>
                <span className="font-body text-xs tabular-nums text-white/40">
                    Spread {spread.toFixed(2)} ({spreadPct.toFixed(2)}%)
                </span>
            </div>

            {/* bids */}
            {view !== "asks" && (
                <div className="pb-2">
                    {bids.map((row) => (
                        <BidRow key={row.price} row={row} currency={currency} />
                    ))}
                </div>
            )}
        </div>
    );
};

export default OrderBook;