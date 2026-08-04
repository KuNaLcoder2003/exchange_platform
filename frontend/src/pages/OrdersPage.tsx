/**
 * OrdersPage.tsx
 * -----------------------------------------------------------------------
 * Order history / open orders view, mapped directly to:
 *
 *   {
 *     id: string;
 *     created_at: Date;
 *     quantity: Decimal;
 *     price: Decimal;
 *     side: $Enums.OrderSide;
 *     status: $Enums.OrderStatus;
 *     remaining_quantity: Decimal;
 *     updated_at: Date;
 *   }[]
 *
 * Prisma `Decimal` serializes to a JSON string, and `DateTime` serializes
 * to an ISO string — so on the wire this is really
 * { quantity: string, price: string, remaining_quantity: string,
 *   created_at: string, updated_at: string, side: OrderSide, status: OrderStatus }[],
 * which is what the type below reflects. Same convention as the Order type
 * used in OrderBook.tsx.
 *
 * Note: this response has no `type` (LIMIT_ORDER/MARKET_ORDER) and no pair
 * field, so neither is rendered here. If your API adds either later, both
 * are easy columns to add.
 *
 * SETUP
 * 1) Add a route in App.tsx: <Route path="/orders" element={<OrdersPage />} />
 * 2) Renders with mock data by default. Pass `live` to fetch for real:
 *
 *      <OrdersPage live />
 *
 *    which does GET {VITE_BACKEND_URL}/api/v1/orders on mount.
 * -----------------------------------------------------------------------
 */

import React, { useCallback, useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

// ---------------------------------------------------------------------------
// Types — mirrors the Prisma-backed API response exactly
// ---------------------------------------------------------------------------

export type OrderSide = "BUY" | "SELL";
export type OrderStatus = "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";

export interface Order {
    id: string;
    created_at: string; // ISO — DateTime serializes as a string over JSON
    quantity: string; // Decimal serializes as a string
    price: string;
    side: OrderSide;
    status: OrderStatus;
    remaining_quantity: string;
    updated_at: string;
}

interface OrdersPageProps {
    /** Pass this to render orders you already have; otherwise mock data is used. */
    orders?: Order[];
    /** When true, fetches from the backend instead of using mock data. Default false. */
    live?: boolean;
    onCancelOrder?: (id: string) => Promise<void> | void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

type FilterTab = "ALL" | "OPEN" | "FILLED" | "CANCELLED";

const OPEN_STATUSES: OrderStatus[] = ["PENDING", "PARTIALLY_FILLED"];

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

function isoAgo(minutes: number) {
    return new Date(Date.now() - minutes * 60_000).toISOString();
}

const MOCK_ORDERS: Order[] = [
    {
        id: "ord_9f21ab",
        side: "BUY",
        status: "PENDING",
        price: "168.20",
        quantity: "12.5000",
        remaining_quantity: "12.5000",
        created_at: isoAgo(4),
        updated_at: isoAgo(4),
    },
    {
        id: "ord_7c88de",
        side: "SELL",
        status: "PARTIALLY_FILLED",
        price: "171.05",
        quantity: "40.0000",
        remaining_quantity: "17.3500",
        created_at: isoAgo(38),
        updated_at: isoAgo(6),
    },
    {
        id: "ord_3a10f4",
        side: "BUY",
        status: "FILLED",
        price: "165.90",
        quantity: "8.0000",
        remaining_quantity: "0.0000",
        created_at: isoAgo(180),
        updated_at: isoAgo(175),
    },
    {
        id: "ord_e40b21",
        side: "SELL",
        status: "CANCELLED",
        price: "174.40",
        quantity: "25.0000",
        remaining_quantity: "25.0000",
        created_at: isoAgo(420),
        updated_at: isoAgo(410),
    },
    {
        id: "ord_1d55c9",
        side: "BUY",
        status: "REJECTED",
        price: "160.00",
        quantity: "100.0000",
        remaining_quantity: "100.0000",
        created_at: isoAgo(600),
        updated_at: isoAgo(600),
    },
    {
        id: "ord_b62f0a",
        side: "BUY",
        status: "FILLED",
        price: "169.75",
        quantity: "5.2000",
        remaining_quantity: "0.0000",
        created_at: isoAgo(1400),
        updated_at: isoAgo(1390),
    },
];

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtNum = (s: string, digits = 2) => {
    const n = parseFloat(s);
    return Number.isNaN(n) ? "—" : n.toLocaleString(undefined, { minimumFractionDigits: digits, maximumFractionDigits: digits });
};

const fmtDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

const STATUS_STYLES: Record<OrderStatus, string> = {
    PENDING: "bg-[#ff7a45]/10 text-[#ff7a45]",
    PARTIALLY_FILLED: "bg-sky-400/10 text-sky-400",
    FILLED: "bg-emerald-400/10 text-emerald-400",
    CANCELLED: "bg-white/10 text-white/50",
    REJECTED: "bg-rose-400/10 text-rose-400",
};

const STATUS_LABEL: Record<OrderStatus, string> = {
    PENDING: "Pending",
    PARTIALLY_FILLED: "Partially filled",
    FILLED: "Filled",
    CANCELLED: "Cancelled",
    REJECTED: "Rejected",
};

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const HeaderNav: React.FC = () => (
    <header className="border-b border-white/10 px-6 py-4 lg:px-8">
        <div className="mx-auto flex max-w-[1200px] items-center gap-6">
            <Link to="/" className="flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7a45]">
                    <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#0a0a0d]">
                        <path d="M12 2 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-4Z" fill="currentColor" />
                    </svg>
                </div>
                <span className="font-display text-lg font-semibold tracking-tight text-white">Vaultline</span>
            </Link>

            <nav className="flex items-center gap-2">
                <Link
                    to="/home"
                    className="rounded-lg border border-transparent px-3 py-1.5 font-body text-sm text-white/70 transition-colors hover:border-white/10 hover:text-white"
                >
                    Trade
                </Link>
                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-body text-sm text-white">
                    Orders
                </span>
                <Link
                    to="/wallet"
                    className="rounded-lg border border-transparent px-3 py-1.5 font-body text-sm text-white/70 transition-colors hover:border-white/10 hover:text-white"
                >
                    Wallet
                </Link>
            </nav>
        </div>
    </header>
);

const FilterTabs: React.FC<{ active: FilterTab; onChange: (t: FilterTab) => void; counts: Record<FilterTab, number> }> = ({
    active,
    onChange,
    counts,
}) => {
    const tabs: { key: FilterTab; label: string }[] = [
        { key: "ALL", label: "All" },
        { key: "OPEN", label: "Open" },
        { key: "FILLED", label: "Filled" },
        { key: "CANCELLED", label: "Cancelled" },
    ];

    return (
        <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
            {tabs.map((t) => (
                <button
                    key={t.key}
                    onClick={() => onChange(t.key)}
                    className={`rounded-md px-3 py-1.5 font-body text-sm font-medium transition-colors ${active === t.key ? "bg-[#ff7a45] text-[#0a0a0d]" : "text-white/50 hover:text-white/80"
                        }`}
                >
                    {t.label}
                    <span className="ml-1.5 text-[11px] opacity-70">{counts[t.key]}</span>
                </button>
            ))}
        </div>
    );
};

const OrdersSkeleton: React.FC = () => (
    <div className="animate-pulse space-y-2">
        {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-xl border border-white/5 bg-white/[0.02]" />
        ))}
    </div>
);

// ---------------------------------------------------------------------------
// Root page
// ---------------------------------------------------------------------------

const OrdersPage: React.FC<OrdersPageProps> = ({ orders: ordersProp, live = true, onCancelOrder }) => {
    const [orders, setOrders] = useState<Order[]>(ordersProp ?? (live ? [] : MOCK_ORDERS));
    const [loading, setLoading] = useState(live && !ordersProp);
    const [error, setError] = useState<string | null>(null);
    const [filter, setFilter] = useState<FilterTab>("ALL");
    const [cancellingId, setCancellingId] = useState<string | null>(null);

    const loadOrders = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/order/getOrders`, { credentials: "include" });
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data = (await res.json());
            setOrders(data.orders);
        } catch (err) {
            console.error(err);
            setError("Couldn't load orders.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (ordersProp) {
            setOrders(ordersProp);
            setLoading(false);
            return;
        }
        if (live) {
            loadOrders();
        } else {
            setOrders(MOCK_ORDERS);
            setLoading(false);
        }
    }, [ordersProp, live, loadOrders]);

    const counts: Record<FilterTab, number> = useMemo(
        () => ({
            ALL: orders.length,
            OPEN: orders.filter((o) => OPEN_STATUSES.includes(o.status)).length,
            FILLED: orders.filter((o) => o.status === "FILLED").length,
            CANCELLED: orders.filter((o) => o.status === "CANCELLED" || o.status === "REJECTED").length,
        }),
        [orders]
    );

    const filtered = useMemo(() => {
        switch (filter) {
            case "OPEN":
                return orders.filter((o) => OPEN_STATUSES.includes(o.status));
            case "FILLED":
                return orders.filter((o) => o.status === "FILLED");
            case "CANCELLED":
                return orders.filter((o) => o.status === "CANCELLED" || o.status === "REJECTED");
            default:
                return orders;
        }
    }, [orders, filter]);

    const handleCancel = async (order: Order) => {
        setCancellingId(order.id);
        try {
            if (onCancelOrder) {
                await onCancelOrder(order.id);
            } else if (live) {
                const res = await fetch(`${BACKEND_URL}/api/v1/orders/${order.id}`, {
                    method: "DELETE",
                    credentials: "include",
                });
                if (!res.ok) throw new Error(`Request failed (${res.status})`);
            }
            setOrders((prev) => prev.map((o) => (o.id === order.id ? { ...o, status: "CANCELLED" } : o)));
            toast.success("Order cancelled");
        } catch (err) {
            console.error(err);
            toast.error("Couldn't cancel order");
        } finally {
            setCancellingId(null);
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0d] font-body text-white">
            <Toaster />
            <HeaderNav />

            <main className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
                <div className="flex flex-wrap items-center justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Orders</h1>
                        <p className="mt-1 font-body text-sm text-white/50">Everything you've placed, open and historical.</p>
                    </div>
                    <FilterTabs active={filter} onChange={setFilter} counts={counts} />
                </div>

                <div className="mt-6 overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f13]">
                    {loading && (
                        <div className="p-4">
                            <OrdersSkeleton />
                        </div>
                    )}

                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center gap-3 py-16">
                            <p className="font-body text-sm text-rose-400">{error}</p>
                            <button
                                onClick={loadOrders}
                                className="rounded-lg border border-white/15 px-4 py-1.5 font-body text-sm text-white/80 hover:border-white/30"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !error && filtered.length === 0 && (
                        <div className="flex flex-col items-center justify-center gap-1 py-16">
                            <p className="font-body text-sm text-white/50">No orders here.</p>
                            <p className="font-body text-xs text-white/30">Orders you place will show up in this list.</p>
                        </div>
                    )}

                    {!loading && !error && filtered.length > 0 && (
                        <div className="overflow-x-auto">
                            <table className="w-full min-w-[720px] border-collapse">
                                <thead>
                                    <tr className="border-b border-white/10 font-body text-xs text-white/40">
                                        <th className="px-5 py-3 text-left font-medium">Side</th>
                                        <th className="px-5 py-3 text-right font-medium">Price</th>
                                        <th className="px-5 py-3 text-right font-medium">Quantity</th>
                                        <th className="px-5 py-3 text-right font-medium">Filled</th>
                                        <th className="px-5 py-3 text-right font-medium">Remaining</th>
                                        <th className="px-5 py-3 text-left font-medium">Status</th>
                                        <th className="px-5 py-3 text-left font-medium">Placed</th>
                                        <th className="px-5 py-3 text-left font-medium">Updated</th>
                                        <th className="px-5 py-3 text-right font-medium" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {filtered.map((order) => {
                                        const qty = parseFloat(order.quantity);
                                        const remaining = parseFloat(order.remaining_quantity);
                                        const filledQty = Math.max(qty - remaining, 0);
                                        const fillPct = qty > 0 ? (filledQty / qty) * 100 : 0;
                                        const isOpen = OPEN_STATUSES.includes(order.status);

                                        return (
                                            <tr key={order.id} className="border-b border-white/5 last:border-b-0 hover:bg-white/[0.02]">
                                                <td className="px-5 py-3.5">
                                                    <span
                                                        className={`font-body text-sm font-semibold ${order.side === "BUY" ? "text-emerald-400" : "text-rose-400"
                                                            }`}
                                                    >
                                                        {order.side === "BUY" ? "Buy" : "Sell"}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-body text-sm text-white/85 tabular-nums">
                                                    {fmtNum(order.price)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-body text-sm text-white/70 tabular-nums">
                                                    {fmtNum(order.quantity, 4)}
                                                </td>
                                                <td className="px-5 py-3.5 text-right">
                                                    <div className="flex items-center justify-end gap-2">
                                                        <div className="h-1 w-14 overflow-hidden rounded-full bg-white/10">
                                                            <div
                                                                className="h-full rounded-full bg-[#ff7a45]"
                                                                style={{ width: `${fillPct}%` }}
                                                            />
                                                        </div>
                                                        <span className="font-body text-xs text-white/40 tabular-nums">{fillPct.toFixed(0)}%</span>
                                                    </div>
                                                </td>
                                                <td className="px-5 py-3.5 text-right font-body text-sm text-white/70 tabular-nums">
                                                    {fmtNum(order.remaining_quantity, 4)}
                                                </td>
                                                <td className="px-5 py-3.5">
                                                    <span className={`rounded-full px-2 py-0.5 font-body text-xs font-medium ${STATUS_STYLES[order.status]}`}>
                                                        {STATUS_LABEL[order.status]}
                                                    </span>
                                                </td>
                                                <td className="px-5 py-3.5 font-body text-xs text-white/50">{fmtDate(order.created_at)}</td>
                                                <td className="px-5 py-3.5 font-body text-xs text-white/50">{fmtDate(order.updated_at)}</td>
                                                <td className="px-5 py-3.5 text-right">
                                                    {isOpen && (
                                                        <button
                                                            onClick={() => handleCancel(order)}
                                                            disabled={cancellingId === order.id}
                                                            className="rounded-lg border border-white/10 px-2.5 py-1 font-body text-xs text-white/60 transition-colors hover:border-rose-400/40 hover:text-rose-400 disabled:opacity-50"
                                                        >
                                                            {cancellingId === order.id ? "Cancelling…" : "Cancel"}
                                                        </button>
                                                    )}
                                                </td>
                                            </tr>
                                        );
                                    })}
                                </tbody>
                            </table>
                        </div>
                    )}
                </div>
            </main>
        </div>
    );
};

export default OrdersPage;