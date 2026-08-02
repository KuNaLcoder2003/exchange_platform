/**
 * WalletPage.tsx
 * -----------------------------------------------------------------------
 * Wallet view mapped directly to the Prisma schema:
 *
 *   model Wallet {
 *     id            String
 *     user_id       String
 *     inr_balance   Decimal
 *     inr_locked    Decimal
 *     usdt_balance  Decimal
 *     usdt_locked   Decimal
 *     created_at    DateTime
 *     updated_ate   DateTime   <- kept exactly as spelled in your schema,
 *                                  since this has to match the API response
 *   }
 *
 * Prisma Decimal fields serialize to JSON as strings (not numbers), so the
 * frontend type below treats every balance as a string and parses it at
 * render time — same convention as the Order type's price/quantity fields.
 *
 * SETUP
 * 1) Add a route in App.tsx:  <Route path="/wallet" element={<WalletPage />} />
 * 2) Renders with mock data by default — no backend required. Pass
 *    `live` to fetch the real wallet instead:
 *
 *      <WalletPage live />
 *
 *    which does GET {VITE_BACKEND_URL}/api/v1/wallet on mount. Or pass a
 *    `wallet` prop directly if you're loading it elsewhere (e.g. a parent
 *    layout that already has the user's session data) — that always wins
 *    over both mock data and `live`.
 * -----------------------------------------------------------------------
 */

import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { Toaster } from "react-hot-toast";

// ---------------------------------------------------------------------------
// Types — mirrors the Prisma model exactly
// ---------------------------------------------------------------------------

export interface Wallet {
    id: string;
    user_id: string;
    inr_balance: string;
    inr_locked: string;
    usdt_balance: string;
    usdt_locked: string;
    created_at: string;
    /** Matches the schema's field name as written (not a typo on this end). */
    updated_ate: string;
}

interface WalletPageProps {
    /** Pass this to render a wallet you already have; otherwise mock data is used. */
    wallet?: Wallet;
    /** When true, fetches the real wallet from the backend instead of using mock data. Default false. */
    live?: boolean;
    /** Display-only conversion used for the combined portfolio estimate. */
    usdtInrRate?: number;
    onDeposit?: (currency: "INR" | "USDT") => void;
    onWithdraw?: (currency: "INR" | "USDT") => void;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL;

// ---------------------------------------------------------------------------
// Mock data — used whenever `live` isn't set and no `wallet` prop is passed
// ---------------------------------------------------------------------------

const MOCK_WALLET: Wallet = {
    id: "wallet_8f2a1c",
    user_id: "user_mock",
    inr_balance: "184320.50",
    inr_locked: "12500.00",
    usdt_balance: "2140.7532",
    usdt_locked: "180.2500",
    created_at: "2025-11-02T09:14:00.000Z",
    updated_ate: new Date().toISOString(),
};

// ---------------------------------------------------------------------------
// Formatting helpers
// ---------------------------------------------------------------------------

const fmtInr = (n: number) =>
    n.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });

const fmtUsdt = (n: number) =>
    n.toLocaleString("en-US", { minimumFractionDigits: 2, maximumFractionDigits: 4 });

const fmtDate = (iso: string) => {
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "—";
    return d.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
    });
};

// ---------------------------------------------------------------------------
// Small pieces
// ---------------------------------------------------------------------------

const HeaderNav: React.FC<{ onLogout: () => void; loggingOut: boolean }> = ({ onLogout, loggingOut }) => (
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
                    to="/markets"
                    className="rounded-lg border border-transparent px-3 py-1.5 font-body text-sm text-white/70 transition-colors hover:border-white/10 hover:text-white"
                >
                    Trade
                </Link>
                <Link
                    to="/orders"
                    className="rounded-lg border border-transparent px-3 py-1.5 font-body text-sm text-white/70 transition-colors hover:border-white/10 hover:text-white"
                >
                    Orders
                </Link>
                <span className="rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 font-body text-sm text-white">
                    Wallet
                </span>
            </nav>

            <button
                onClick={onLogout}
                disabled={loggingOut}
                className="ml-auto flex items-center gap-1.5 rounded-lg border border-white/10 px-3 py-1.5 font-body text-sm text-white/70 transition-colors hover:border-rose-400/40 hover:text-rose-400 disabled:opacity-50"
            >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4M16 17l5-5-5-5M21 12H9" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                {loggingOut ? "Logging out…" : "Logout"}
            </button>
        </div>
    </header>
);

interface AssetCardProps {
    symbol: string;
    name: string;
    available: number;
    locked: number;
    format: (n: number) => string;
    accentClass: string; // text + bg + border color group, e.g. "text-[#ff7a45] bg-[#ff7a45]/10 ..."
    barClass: string;
    onDeposit?: () => void;
    onWithdraw?: () => void;
}

const AssetCard: React.FC<AssetCardProps> = ({
    symbol,
    name,
    available,
    locked,
    format,
    accentClass,
    barClass,
    onDeposit,
    onWithdraw,
}) => {
    const total = available + locked;
    const lockedPct = total > 0 ? (locked / total) * 100 : 0;

    return (
        <div className="rounded-2xl border border-white/10 bg-[#0f0f13] p-6">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className={`flex h-10 w-10 items-center justify-center rounded-full font-display text-sm font-semibold ${accentClass}`}>
                        {symbol.slice(0, 1)}
                    </div>
                    <div>
                        <div className="font-body text-sm font-medium text-white">{symbol}</div>
                        <div className="font-body text-xs text-white/40">{name}</div>
                    </div>
                </div>
            </div>

            <div className="mt-5">
                <div className="font-body text-xs text-white/40">Available balance</div>
                <div className="mt-1 font-display text-3xl font-semibold text-white tabular-nums">
                    {format(available)} <span className="text-base font-medium text-white/40">{symbol}</span>
                </div>
            </div>

            <div className="mt-4 flex items-center justify-between font-body text-xs text-white/50">
                <span className="flex items-center gap-1.5">
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <rect x="5" y="10" width="14" height="10" rx="2" stroke="currentColor" strokeWidth="1.6" />
                        <path d="M8 10V7a4 4 0 0 1 8 0v3" stroke="currentColor" strokeWidth="1.6" />
                    </svg>
                    Locked in orders
                </span>
                <span className="tabular-nums text-white/70">
                    {format(locked)} {symbol}
                </span>
            </div>

            <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/5">
                <div className={`h-full rounded-full ${barClass}`} style={{ width: `${lockedPct}%` }} />
            </div>

            <div className="mt-4 flex items-center justify-between font-body text-xs text-white/40">
                <span>Total</span>
                <span className="tabular-nums text-white/70">
                    {format(total)} {symbol}
                </span>
            </div>

            <div className="mt-5 grid grid-cols-2 gap-2.5">
                <button
                    onClick={onDeposit}
                    className="rounded-xl bg-[#ff7a45] py-2.5 font-body text-sm font-semibold text-[#0a0a0d] transition-transform hover:scale-[1.02] active:scale-[0.98]"
                >
                    Deposit
                </button>
                <button
                    onClick={onWithdraw}
                    className="rounded-xl border border-white/15 py-2.5 font-body text-sm font-semibold text-white/85 transition-colors hover:border-white/30"
                >
                    Withdraw
                </button>
            </div>
        </div>
    );
};

const WalletSkeleton: React.FC = () => (
    <div className="grid gap-5 md:grid-cols-2">
        {[0, 1].map((i) => (
            <div key={i} className="animate-pulse rounded-2xl border border-white/10 bg-[#0f0f13] p-6">
                <div className="flex items-center gap-3">
                    <div className="h-10 w-10 rounded-full bg-white/10" />
                    <div className="space-y-2">
                        <div className="h-3 w-14 rounded bg-white/10" />
                        <div className="h-2.5 w-20 rounded bg-white/5" />
                    </div>
                </div>
                <div className="mt-6 h-8 w-40 rounded bg-white/10" />
                <div className="mt-6 h-1.5 w-full rounded-full bg-white/5" />
                <div className="mt-5 grid grid-cols-2 gap-2.5">
                    <div className="h-10 rounded-xl bg-white/10" />
                    <div className="h-10 rounded-xl bg-white/5" />
                </div>
            </div>
        ))}
    </div>
);

// ---------------------------------------------------------------------------
// Root page
// ---------------------------------------------------------------------------

const WalletPage: React.FC<WalletPageProps> = ({
    wallet: walletProp,
    live = false,
    usdtInrRate = 92.5,
    onDeposit,
    onWithdraw,
}) => {
    const [wallet, setWallet] = useState<Wallet | null>(walletProp ?? (live ? null : MOCK_WALLET));
    const [loading, setLoading] = useState(live && !walletProp);
    const [error, setError] = useState<string | null>(null);
    const [loggingOut, setLoggingOut] = useState(false);

    const loadWallet = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch(`${BACKEND_URL}/api/v1/wallet`, {
                credentials: "include",
            });
            if (!res.ok) throw new Error(`Request failed (${res.status})`);
            const data = (await res.json()) as Wallet;
            setWallet(data);
        } catch (err) {
            console.error(err);
            setError("Couldn't load your wallet.");
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        if (walletProp) {
            setWallet(walletProp);
            setLoading(false);
            return;
        }
        if (live) {
            loadWallet();
        } else {
            setWallet(MOCK_WALLET);
            setLoading(false);
        }
    }, [walletProp, live, loadWallet]);

    const handleLogout = async () => {
        setLoggingOut(true);
        try {
            localStorage.removeItem("token");
            window.location.href = "/auth";
        } finally {
            setLoggingOut(false);
        }
    };

    const handleDeposit = (currency: "INR" | "USDT") => {
        if (onDeposit) return onDeposit(currency);
        toast(`Deposit flow for ${currency} isn't wired up yet.`);
    };

    const handleWithdraw = (currency: "INR" | "USDT") => {
        if (onWithdraw) return onWithdraw(currency);
        toast(`Withdraw flow for ${currency} isn't wired up yet.`);
    };

    const inrAvailable = wallet ? parseFloat(wallet.inr_balance) : 0;
    const inrLocked = wallet ? parseFloat(wallet.inr_locked) : 0;
    const usdtAvailable = wallet ? parseFloat(wallet.usdt_balance) : 0;
    const usdtLocked = wallet ? parseFloat(wallet.usdt_locked) : 0;

    const estimatedTotalInr = inrAvailable + inrLocked + (usdtAvailable + usdtLocked) * usdtInrRate;

    return (
        <div className="min-h-screen bg-[#0a0a0d] font-body text-white">
            <Toaster />
            <HeaderNav onLogout={handleLogout} loggingOut={loggingOut} />

            <main className="mx-auto max-w-[1200px] px-6 py-10 lg:px-8">
                <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                        <h1 className="font-display text-3xl font-semibold tracking-tight text-white">Wallet</h1>
                        <p className="mt-1 font-body text-sm text-white/50">
                            Your balances across INR and USDT, available and locked in open orders.
                        </p>
                    </div>

                    {wallet && (
                        <div className="text-right">
                            <div className="font-body text-xs text-white/40">Estimated total</div>
                            <div className="font-display text-2xl font-semibold text-white tabular-nums">
                                ₹{fmtInr(estimatedTotalInr)}
                            </div>
                            <div className="font-body text-[11px] text-white/30">at 1 USDT ≈ ₹{usdtInrRate}</div>
                        </div>
                    )}
                </div>

                <div className="mt-8">
                    {loading && <WalletSkeleton />}

                    {!loading && error && (
                        <div className="flex flex-col items-center justify-center gap-3 rounded-2xl border border-rose-500/20 bg-[#0f0f13] py-16">
                            <p className="font-body text-sm text-rose-400">{error}</p>
                            <button
                                onClick={loadWallet}
                                className="rounded-lg border border-white/15 px-4 py-1.5 font-body text-sm text-white/80 hover:border-white/30"
                            >
                                Retry
                            </button>
                        </div>
                    )}

                    {!loading && !error && wallet && (
                        <>
                            <div className="grid gap-5 md:grid-cols-2">
                                <AssetCard
                                    symbol="INR"
                                    name="Indian Rupee"
                                    available={inrAvailable}
                                    locked={inrLocked}
                                    format={fmtInr}
                                    accentClass="bg-[#ff7a45]/15 text-[#ff7a45]"
                                    barClass="bg-[#ff7a45]"
                                    onDeposit={() => handleDeposit("INR")}
                                    onWithdraw={() => handleWithdraw("INR")}
                                />
                                <AssetCard
                                    symbol="USDT"
                                    name="Tether"
                                    available={usdtAvailable}
                                    locked={usdtLocked}
                                    format={fmtUsdt}
                                    accentClass="bg-teal-400/15 text-teal-400"
                                    barClass="bg-teal-400"
                                    onDeposit={() => handleDeposit("USDT")}
                                    onWithdraw={() => handleWithdraw("USDT")}
                                />
                            </div>

                            <p className="mt-8 font-body text-xs text-white/30">
                                Last updated {fmtDate(wallet.updated_ate)} · Wallet ID {wallet.id}
                            </p>
                        </>
                    )}
                </div>
            </main>
        </div>
    );
};

export default WalletPage;