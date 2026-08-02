/**
 * LandingPage.tsx
 * -----------------------------------------------------------------------
 * A crypto-exchange landing page in the spirit of backpack.exchange —
 * obsidian-black canvas, molten-copper accent, glass panels, big confident
 * display type. Built with React + TypeScript + Tailwind CSS.
 *
 * SETUP
 * 1) Tailwind must be installed in your project (v3+).
 * 2) Add the two Google Fonts below to your index.html <head>:
 *
 *    <link rel="preconnect" href="https://fonts.googleapis.com">
 *    <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
 *    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
 *
 * 3) In tailwind.config.js, extend the theme (optional, classes below also
 *    work with arbitrary values so this step is purely for convenience):
 *
 *    theme: {
 *      extend: {
 *        fontFamily: {
 *          display: ['"Bricolage Grotesque"', 'sans-serif'],
 *          body: ['"Instrument Sans"', 'sans-serif'],
 *        },
 *        colors: {
 *          ink: '#0a0a0d',
 *          copper: '#ff7a45',
 *          ember: '#ffb37a',
 *        },
 *      },
 *    }
 *
 * 4) Drop <LandingPage /> anywhere in your app.
 * -----------------------------------------------------------------------
 */

import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import MarketHero from "../components/MarketHero";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface NavLink {
    label: string;
    href: string;
}

interface StatItem {
    value: string;
    label: string;
}

interface FeatureCard {
    icon: React.ReactNode;
    title: string;
    description: string;
}

interface MarketRow {
    pair: string;
    price: string;
    change: number;
}

// ---------------------------------------------------------------------------
// Static data
// ---------------------------------------------------------------------------

const NAV_LINKS: NavLink[] = [
    { label: "Trade", href: "#platform" },
    { label: "Earn", href: "#earn" },
    { label: "Borrow", href: "#borrow" },
    { label: "Wallet", href: "#wallet" },
    { label: "Company", href: "#company" },
];

const STATS: StatItem[] = [
    { value: "$14.2B+", label: "Cumulative volume" },
    { value: "2.1M", label: "Funded accounts" },
    { value: "180+", label: "Markets listed" },
    { value: "99.99%", label: "Uptime, matching engine" },
];

const MARKETS: MarketRow[] = [
    { pair: "SOL / USDC", price: "$142.87", change: 4.62 },
    { pair: "BTC / USDC", price: "$71,204.10", change: 1.14 },
    { pair: "ETH / USDC", price: "$3,481.55", change: -0.87 },
    { pair: "JTO / USDC", price: "$2.94", change: 8.31 },
    { pair: "BONK / USDC", price: "$0.00002841", change: -2.03 },
];

const FEATURES: FeatureCard[] = [
    {
        title: "Spot & Perps in one book",
        description:
            "A single unified margin account across spot and perpetual futures — no shuffling collateral between silos.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path d="M4 19V5M4 19h16M4 19l5-6 4 3 6-8" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        title: "Self-custody wallet, built in",
        description:
            "Send, receive, and hold assets across chains from the same interface you trade from — keys stay yours.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth="1.6" />
                <path d="M3 10h18M15 14h3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        ),
    },
    {
        title: "Sub-millisecond matching",
        description:
            "An order book engine written for latency-sensitive flow, colocated and stress-tested at exchange scale.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path d="M13 2 3 14h7l-1 8 10-12h-7l1-8Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        title: "Yield on idle collateral",
        description:
            "Assets sitting in your account earn automatically — no separate staking flow, no locked positions.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <circle cx="12" cy="12" r="9" stroke="currentColor" strokeWidth="1.6" />
                <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        title: "Proof of reserves",
        description:
            "Independently attested, published on a cadence, verifiable on-chain — audit the exchange without trusting it.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <path d="M12 3 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-3Z" stroke="currentColor" strokeWidth="1.6" strokeLinejoin="round" />
                <path d="m9 12 2 2 4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        title: "Cross-chain from day one",
        description:
            "Deposit from Solana, Ethereum, Bitcoin and a growing list of L2s without routing through a bridge yourself.",
        icon: (
            <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                <circle cx="7" cy="7" r="3" stroke="currentColor" strokeWidth="1.6" />
                <circle cx="17" cy="17" r="3" stroke="currentColor" strokeWidth="1.6" />
                <path d="M9.5 9.5 14.5 14.5M17 7l-10 10" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
            </svg>
        ),
    },
];

// ---------------------------------------------------------------------------
// Small presentational components
// ---------------------------------------------------------------------------

const GlassPanel: React.FC<{ className?: string; children: React.ReactNode }> = ({
    className = "",
    children,
}) => (
    <div
        className={`rounded-2xl border border-white/10 bg-white/[0.03] backdrop-blur-xl ${className}`}
    >
        {children}
    </div>
);

const PrimaryButton: React.FC<{ children: React.ReactNode; className?: string; to?: string }> = ({
    children,
    className = "",
    to,
}) => {
    const cls = `group relative inline-flex items-center justify-center overflow-hidden rounded-full bg-[#ff7a45] px-7 py-3 font-body text-sm font-semibold text-[#0a0a0d] transition-transform duration-300 hover:scale-[1.03] active:scale-[0.98] ${className}`;
    const content = (
        <>
            <span className="relative z-10">{children}</span>
            <span className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/40 to-transparent transition-transform duration-700 group-hover:translate-x-full" />
        </>
    );
    return to ? (
        <Link to={to} className={cls}>
            {content}
        </Link>
    ) : (
        <button className={cls}>{content}</button>
    );
};

const GhostButton: React.FC<{ children: React.ReactNode; className?: string; to?: string }> = ({
    children,
    className = "",
    to,
}) => {
    const cls = `inline-flex items-center justify-center rounded-full border border-white/15 px-7 py-3 font-body text-sm font-semibold text-white/90 transition-colors duration-300 hover:border-white/40 hover:bg-white/5 ${className}`;
    return to ? (
        <Link to={to} className={cls}>
            {children}
        </Link>
    ) : (
        <button className={cls}>{children}</button>
    );
};

// ---------------------------------------------------------------------------
// Sections
// ---------------------------------------------------------------------------

const NavBar: React.FC = () => {
    const [scrolled, setScrolled] = useState(false);

    useEffect(() => {
        const onScroll = () => setScrolled(window.scrollY > 12);
        window.addEventListener("scroll", onScroll);
        return () => window.removeEventListener("scroll", onScroll);
    }, []);

    return (
        <header
            className={`fixed inset-x-0 top-0 z-50 transition-colors duration-300 ${scrolled ? "bg-[#0a0a0d]/80 backdrop-blur-xl border-b border-white/10" : "bg-transparent"
                }`}
        >
            <nav className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4 lg:px-10">
                <Link to="/" className="flex items-center gap-2">
                    <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-[#ff7a45]">
                        <svg viewBox="0 0 24 24" fill="none" className="h-5 w-5 text-[#0a0a0d]">
                            <path d="M12 2 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-4Z" fill="currentColor" />
                        </svg>
                    </div>
                    <span className="font-display text-lg font-semibold tracking-tight text-white">
                        Vaultline
                    </span>
                </Link>

                <div className="hidden items-center gap-8 lg:flex">
                    {NAV_LINKS.map((link) => (
                        <a
                            key={link.label}
                            href={link.href}
                            className="font-body text-sm text-white/70 transition-colors hover:text-white"
                        >
                            {link.label}
                        </a>
                    ))}
                </div>

                <div className="hidden items-center gap-3 lg:flex">
                    <button className="font-body text-sm font-medium text-white/80 hover:text-white">
                        Log in
                    </button>
                    <PrimaryButton className="!px-5 !py-2 text-xs" to="/markets">Sign up</PrimaryButton>
                </div>

                <button className="lg:hidden text-white/80">
                    <svg viewBox="0 0 24 24" fill="none" className="h-6 w-6">
                        <path d="M4 7h16M4 12h16M4 17h16" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                </button>
            </nav>
        </header>
    );
};

const Hero: React.FC = () => (
    <section className="relative overflow-hidden pt-40 pb-28 lg:pt-52 lg:pb-36">
        {/* ambient gradient glow */}
        <div className="pointer-events-none absolute left-1/2 top-0 h-[560px] w-[900px] -translate-x-1/2 rounded-full bg-[#ff7a45]/20 blur-[140px]" />
        <div className="pointer-events-none absolute -right-40 top-40 h-[400px] w-[400px] rounded-full bg-[#4a3aff]/10 blur-[120px]" />

        <div className="relative mx-auto max-w-7xl px-6 lg:px-10">
            <div className="mx-auto max-w-4xl text-center opacity-0 animate-[fadeUp_0.8s_ease_forwards]">
                <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-4 py-1.5">
                    <span className="h-1.5 w-1.5 rounded-full bg-[#ff7a45]" />
                    <span className="font-body text-xs text-white/70">Now live on 6 chains</span>
                </div>

                <h1 className="font-display text-5xl font-semibold leading-[1.05] tracking-tight text-white sm:text-6xl lg:text-7xl">
                    The exchange built for
                    <span className="block bg-gradient-to-r from-[#ff7a45] to-[#ffb37a] bg-clip-text text-transparent">
                        people who trade for real
                    </span>
                </h1>

                <p className="mx-auto mt-6 max-w-xl font-body text-lg text-white/60">
                    Spot, perpetuals, and a self-custody wallet in one fast, unified
                    account. No juggling apps. No waiting on withdrawals.
                </p>

                <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
                    <PrimaryButton className="w-full sm:w-auto" to="/markets">Start trading</PrimaryButton>
                    <GhostButton className="w-full sm:w-auto">Download the app</GhostButton>
                </div>
            </div>

            {/* live-ticker style market panel */}
            <div className="mx-auto mt-20 max-w-3xl opacity-0 animate-[fadeUp_0.8s_ease_0.15s_forwards]">
                <GlassPanel className="overflow-hidden">
                    <div className="flex items-center justify-between border-b border-white/10 px-6 py-4">
                        <span className="font-body text-sm font-medium text-white/80">Markets</span>
                        <span className="font-body text-xs text-white/40">Live</span>
                    </div>
                    <div className="divide-y divide-white/5">
                        {MARKETS.map((row) => (
                            <div
                                key={row.pair}
                                className="flex items-center justify-between px-6 py-3.5 transition-colors hover:bg-white/[0.03]"
                            >
                                <span className="font-body text-sm text-white/80">{row.pair}</span>
                                <div className="flex items-center gap-4">
                                    <span className="font-body text-sm text-white/90 tabular-nums">{row.price}</span>
                                    <span
                                        className={`font-body text-xs font-medium tabular-nums ${row.change >= 0 ? "text-emerald-400" : "text-rose-400"
                                            }`}
                                    >
                                        {row.change >= 0 ? "+" : ""}
                                        {row.change.toFixed(2)}%
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>
                </GlassPanel>
            </div>
        </div>
    </section>
);

const StatsBar: React.FC = () => (
    <section className="border-y border-white/10 bg-white/[0.02]">
        <div className="mx-auto grid max-w-7xl grid-cols-2 gap-8 px-6 py-14 lg:grid-cols-4 lg:px-10">
            {STATS.map((stat) => (
                <div key={stat.label} className="text-center lg:text-left">
                    <div className="font-display text-3xl font-semibold text-white lg:text-4xl">
                        {stat.value}
                    </div>
                    <div className="mt-1 font-body text-sm text-white/50">{stat.label}</div>
                </div>
            ))}
        </div>
    </section>
);

const PlatformPreview: React.FC = () => (
    <section id="platform" className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
            <span className="font-body text-sm font-medium uppercase tracking-widest text-[#ff7a45]">
                Inside Vaultline
            </span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white lg:text-5xl">
                One dashboard, every market
            </h2>
            <p className="mt-4 font-body text-white/60">
                This is the same markets view live traders use — not a staged
                screenshot. Scroll it, flip the tabs, watch the tickers.
            </p>
        </div>

        <GlassPanel className="mx-auto mt-12 max-w-[1400px] overflow-hidden p-4 lg:p-6">
            <MarketHero embedded />
        </GlassPanel>
    </section>
);

const Features: React.FC = () => (
    <section id="features" className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
        <div className="mx-auto max-w-2xl text-center">
            <span className="font-body text-sm font-medium uppercase tracking-widest text-[#ff7a45]">
                Why Vaultline
            </span>
            <h2 className="mt-4 font-display text-4xl font-semibold tracking-tight text-white lg:text-5xl">
                Everything under one account
            </h2>
            <p className="mt-4 font-body text-white/60">
                Most exchanges make you choose between speed, custody, and yield.
                Vaultline was built so you don't have to.
            </p>
        </div>

        <div className="mt-16 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {FEATURES.map((feature) => (
                <GlassPanel
                    key={feature.title}
                    className="group p-7 transition-colors duration-300 hover:border-[#ff7a45]/30 hover:bg-white/[0.05]"
                >
                    <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#ff7a45]/10 text-[#ff7a45] transition-colors group-hover:bg-[#ff7a45]/20">
                        {feature.icon}
                    </div>
                    <h3 className="mt-5 font-display text-lg font-semibold text-white">
                        {feature.title}
                    </h3>
                    <p className="mt-2 font-body text-sm leading-relaxed text-white/55">
                        {feature.description}
                    </p>
                </GlassPanel>
            ))}
        </div>
    </section>
);

const Showcase: React.FC = () => (
    <section id="wallet" className="mx-auto max-w-7xl px-6 py-10 lg:px-10">
        <GlassPanel className="relative overflow-hidden px-8 py-16 lg:px-16 lg:py-20">
            <div className="pointer-events-none absolute -left-24 -top-24 h-72 w-72 rounded-full bg-[#ff7a45]/20 blur-[100px]" />
            <div className="relative grid items-center gap-12 lg:grid-cols-2">
                <div>
                    <span className="font-body text-sm font-medium uppercase tracking-widest text-[#ff7a45]">
                        One wallet, every chain
                    </span>
                    <h2 className="mt-4 font-display text-3xl font-semibold tracking-tight text-white lg:text-4xl">
                        Your keys. Your assets.
                        <br />
                        Still one interface.
                    </h2>
                    <p className="mt-4 font-body text-white/60">
                        Vaultline's built-in wallet holds Solana, Ethereum, and Bitcoin
                        assets side by side with your trading balance — swap, send, and
                        bridge without leaving the app.
                    </p>
                    <ul className="mt-6 space-y-3">
                        {["Non-custodial by default", "Hardware wallet support", "Gasless swaps on supported chains"].map(
                            (item) => (
                                <li key={item} className="flex items-center gap-3 font-body text-sm text-white/70">
                                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 shrink-0 text-[#ff7a45]">
                                        <path d="m5 12 5 5 9-9" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                    {item}
                                </li>
                            )
                        )}
                    </ul>
                </div>

                <div className="relative">
                    <GlassPanel className="mx-auto max-w-sm bg-[#0f0f13] p-6">
                        <div className="flex items-center justify-between">
                            <span className="font-body text-xs text-white/50">Total balance</span>
                            <span className="rounded-full bg-emerald-400/10 px-2 py-0.5 font-body text-xs text-emerald-400">
                                +2.4%
                            </span>
                        </div>
                        <div className="mt-2 font-display text-3xl font-semibold text-white">
                            $48,219.05
                        </div>
                        <div className="mt-6 space-y-3">
                            {[
                                { name: "Solana", amount: "312.4 SOL", value: "$44,624.20" },
                                { name: "Bitcoin", amount: "0.024 BTC", value: "$1,708.90" },
                                { name: "USDC", amount: "1,885.95", value: "$1,885.95" },
                            ].map((asset) => (
                                <div key={asset.name} className="flex items-center justify-between border-t border-white/5 pt-3">
                                    <div>
                                        <div className="font-body text-sm text-white/85">{asset.name}</div>
                                        <div className="font-body text-xs text-white/40">{asset.amount}</div>
                                    </div>
                                    <div className="font-body text-sm text-white/70 tabular-nums">{asset.value}</div>
                                </div>
                            ))}
                        </div>
                    </GlassPanel>
                </div>
            </div>
        </GlassPanel>
    </section>
);

const CTASection: React.FC = () => (
    <section className="mx-auto max-w-7xl px-6 py-28 lg:px-10">
        <div className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-[#ff7a45] to-[#ffb37a] px-8 py-16 text-center lg:py-20">
            <div className="pointer-events-none absolute -right-16 -top-16 h-64 w-64 rounded-full bg-white/20 blur-3xl" />
            <h2 className="font-display text-3xl font-semibold tracking-tight text-[#0a0a0d] lg:text-5xl">
                Ready to trade at full speed?
            </h2>
            <p className="mx-auto mt-4 max-w-lg font-body text-[#0a0a0d]/70">
                Create an account in under two minutes. No paperwork, no waiting
                period, no minimum deposit.
            </p>
            <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
                <Link
                    to="/markets"
                    className="w-full rounded-full bg-[#0a0a0d] px-7 py-3 text-center font-body text-sm font-semibold text-white transition-transform hover:scale-[1.03] sm:w-auto"
                >
                    Create free account
                </Link>
                <button className="w-full rounded-full border border-[#0a0a0d]/20 px-7 py-3 font-body text-sm font-semibold text-[#0a0a0d] transition-colors hover:bg-[#0a0a0d]/10 sm:w-auto">
                    Read the docs
                </button>
            </div>
        </div>
    </section>
);

const Footer: React.FC = () => (
    <footer id="company" className="border-t border-white/10">
        <div className="mx-auto max-w-7xl px-6 py-16 lg:px-10">
            <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-5">
                <div className="lg:col-span-2">
                    <div className="flex items-center gap-2">
                        <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff7a45]">
                            <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#0a0a0d]">
                                <path d="M12 2 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-4Z" fill="currentColor" />
                            </svg>
                        </div>
                        <span className="font-display text-base font-semibold text-white">Vaultline</span>
                    </div>
                    <p className="mt-4 max-w-xs font-body text-sm text-white/50">
                        A faster, more transparent way to trade digital assets — spot,
                        perps, and self-custody in one account.
                    </p>
                </div>

                {[
                    { title: "Product", items: ["Spot", "Perpetuals", "Wallet", "Earn"] },
                    { title: "Company", items: ["About", "Careers", "Blog", "Press"] },
                    { title: "Resources", items: ["Docs", "API", "Status", "Support"] },
                ].map((col) => (
                    <div key={col.title}>
                        <h4 className="font-body text-sm font-semibold text-white">{col.title}</h4>
                        <ul className="mt-4 space-y-3">
                            {col.items.map((item) => (
                                <li key={item}>
                                    <a href="#" className="font-body text-sm text-white/50 hover:text-white/80">
                                        {item}
                                    </a>
                                </li>
                            ))}
                        </ul>
                    </div>
                ))}
            </div>

            <div className="mt-14 flex flex-col items-center justify-between gap-4 border-t border-white/10 pt-8 sm:flex-row">
                <span className="font-body text-xs text-white/40">
                    © {new Date().getFullYear()} Vaultline. All rights reserved.
                </span>
                <div className="flex gap-6">
                    <a href="#" className="font-body text-xs text-white/40 hover:text-white/70">Terms</a>
                    <a href="#" className="font-body text-xs text-white/40 hover:text-white/70">Privacy</a>
                    <a href="#" className="font-body text-xs text-white/40 hover:text-white/70">Cookies</a>
                </div>
            </div>
        </div>
    </footer>
);

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------

const LandingPage: React.FC = () => {
    return (
        <div className="min-h-screen bg-[#0a0a0d] font-body text-white antialiased [--tw-scroll-behavior:smooth]">
            <style>{`
        @keyframes fadeUp {
          from { opacity: 0; transform: translateY(24px); }
          to { opacity: 1; transform: translateY(0); }
        }
        html { scroll-behavior: smooth; }
        body { background: #0a0a0d; }
      `}</style>

            <NavBar />
            <Hero />
            <StatsBar />
            <PlatformPreview />
            <Features />
            <Showcase />
            <CTASection />
            <Footer />
        </div>
    );
};

export default LandingPage;