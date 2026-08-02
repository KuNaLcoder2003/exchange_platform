/**
 * Dashboard.tsx
 * -----------------------------------------------------------------------
 * The main trading screen: market header, price chart, order book, and the
 * order entry panel, laid out the way most exchanges do — chart on the
 * left, book in the middle, order form on the right. Stacks vertically on
 * small screens.
 *
 * SETUP — same as the other components in this project. This file expects
 * OrderBook.tsx, PriceChart.tsx, and OrderEntryForm.tsx alongside it.
 *
 * Wire `onPlaceOrder` to your actual order-placement endpoint:
 *
 *   <Dashboard
 *     onPlaceOrder={async (order) => {
 *       const res = await fetch(`${BACKEND_URL}/api/v1/orders`, {
 *         method: "POST",
 *         headers: { "Content-Type": "application/json" },
 *         body: JSON.stringify(order),
 *       });
 *       ...
 *     }}
 *   />
 * -----------------------------------------------------------------------
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";
import OrderBook from "./OrderBook";
import PriceChart from "./PriceChart";
import OrderEntryForm, { type PlaceOrderPayload } from "./OrderEntryForm";
import { useAuth } from "../context/AuthContext";

interface DashboardProps {
    pair?: string;
    onPlaceOrder?: (order: PlaceOrderPayload) => Promise<void> | void;
    /** Called when the user clicks Logout. If omitted, falls back to redirecting to /auth. */
    onLogout?: () => void | Promise<void>;
}

const STATS = [
    { label: "24h high", value: "$172.40" },
    { label: "24h low", value: "$161.10" },
    { label: "24h volume", value: "612.2K SOL" },
    { label: "Open interest", value: "$88.4M" },
];

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL

const Dashboard: React.FC<DashboardProps> = ({ pair = "SOL/USDC" }) => {
    const [connectionDot] = useState(true);
    const [loggingOut, setLoggingOut] = useState(false);
    const { logout } = useAuth()

    const handleLogout = async () => {
        setLoggingOut(true);
        try {

            await logout()
        } catch (error) {
            console.log('Error')
        }
        setLoggingOut(false)

    };

    const handlePlaceOrder = async (order: PlaceOrderPayload) => {
        try {

            const response = await fetch(`${BACKEND_URL}/api/v1/order/newOrder`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                credentials: "include",
                body: JSON.stringify(order)
            })

            const data = await response.json()

            if (data.valid) {
                toast.success(
                    `${order.side === "BUY" ? "Buy" : "Sell"} order placed — ${order.quantity} ${pair.split("/")[0]}${order.price ? ` @ ${order.price}` : " @ market"
                    }`
                );
            }
            else {
                toast.error(data.message)
            }

        } catch (err) {
            console.error(err);
            toast.error("Couldn't place order");
        }
    };

    return (
        <div className="min-h-screen bg-[#0a0a0d] font-body text-white">
            <Toaster />

            {/* market header */}
            <header className="border-b border-white/10 px-6 py-4 lg:px-8">
                <div className="mx-auto flex max-w-[1600px] flex-wrap items-center gap-x-8 gap-y-3">
                    <div className="flex items-center gap-3">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7a45]">
                            <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#0a0a0d]">
                                <path d="M12 2 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-4Z" fill="currentColor" />
                            </svg>
                        </div>
                        <button className="flex items-center gap-1.5 font-display text-lg font-semibold text-white">
                            {pair}
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white/40">
                                <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                        </button>
                        <span
                            className={`h-1.5 w-1.5 rounded-full ${connectionDot ? "bg-emerald-400" : "bg-white/25"}`}
                            aria-label="Live"
                        />
                    </div>

                    <div className="flex flex-wrap items-center gap-x-8 gap-y-2">
                        {STATS.map((s) => (
                            <div key={s.label}>
                                <div className="font-body text-[11px] text-white/40">{s.label}</div>
                                <div className="font-body text-sm text-white/85 tabular-nums">{s.value}</div>
                            </div>
                        ))}
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <Link
                            to="/orders"
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-body text-sm text-white/70 transition-colors hover:border-white/25 hover:text-white"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            Orders
                        </Link>
                        <Link
                            to="/addMoney"
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-body text-sm text-white/70 transition-colors hover:border-white/25 hover:text-white"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                <path d="M4 6h16M4 12h16M4 18h10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            Add Funds
                        </Link>

                        <Link
                            to="/wallet"
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-body text-sm text-white/70 transition-colors hover:border-white/25 hover:text-white"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
                                <path d="M3 10h18M15 14h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                            </svg>
                            Wallet
                        </Link>

                        <button
                            onClick={handleLogout}
                            disabled={loggingOut}
                            className="flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-body text-sm text-white/70 transition-colors hover:border-rose-400/40 hover:text-rose-400 disabled:opacity-50"
                        >
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                                <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                            {loggingOut ? "Logging out…" : "Logout"}
                        </button>
                    </div>
                </div>
            </header>

            {/* main grid */}
            <main className="mx-auto max-w-[1600px] p-4 lg:p-6">
                <div className="flex flex-col gap-4 xl:flex-row">
                    {/* chart */}
                    <div className="min-w-0 flex-1">
                        <div className="h-[420px] lg:h-[520px]">
                            <PriceChart pair={pair} />
                        </div>
                    </div>

                    {/* order book */}
                    <div className="shrink-0 xl:w-[340px]">
                        <OrderBook pair={pair} connectionStatus="open" />
                    </div>

                    {/* order entry */}
                    <div className="shrink-0 xl:w-[320px]">
                        <OrderEntryForm pair={pair} onSubmit={handlePlaceOrder} />
                    </div>
                </div>
            </main>
        </div>
    );
};

export default Dashboard;