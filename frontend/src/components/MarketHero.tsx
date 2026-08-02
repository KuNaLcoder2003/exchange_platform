/**
 * MarketHero.tsx
 * -----------------------------------------------------------------------
 * The "markets home" hero — top nav, promo banner carousel, three quick-list
 * panels (New / Top Gainers / Popular), and a spot/futures/lending market
 * table with sparklines. Same Vaultline brand + palette as LandingPage.tsx.
 *
 * SETUP — identical to LandingPage.tsx:
 * 1) Tailwind v3+ installed.
 * 2) Fonts in index.html:
 *    <link href="https://fonts.googleapis.com/css2?family=Bricolage+Grotesque:opsz,wght@12..96,400..800&family=Instrument+Sans:ital,wght@0,400..700;1,400..700&display=swap" rel="stylesheet">
 * 3) Optional tailwind.config.js fontFamily.display / fontFamily.body extension.
 * -----------------------------------------------------------------------
 */

import React, { useState } from "react";
import { Link } from "react-router-dom";

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

interface QuickToken {
    symbol: string;
    name: string;
    price: string;
    change: number;
}

interface MarketRow {
    symbol: string;
    name: string;
    price: string;
    marketCap: string;
    volume24h: string;
    change24h: number;
    spark: number[];
}

type MarketTab = "Spot" | "Futures" | "Lending";

// ---------------------------------------------------------------------------
// Mock data
// ---------------------------------------------------------------------------

const NEW_TOKENS: QuickToken[] = [
    { symbol: "ORCA", name: "Orca", price: "$3.21", change: -1.42 },
    { symbol: "PYTH", name: "Pyth Network", price: "$0.318", change: 3.09 },
    { symbol: "WIF", name: "dogwifhat", price: "$1.84", change: 6.55 },
    { symbol: "TNSR", name: "Tensor", price: "$0.612", change: -0.31 },
    { symbol: "RENDER", name: "Render", price: "$8.92", change: 2.14 },
];

const TOP_GAINERS: QuickToken[] = [
    { symbol: "JTO", name: "Jito", price: "$2.94", change: 11.96 },
    { symbol: "RAY", name: "Raydium", price: "$4.44", change: 7.19 },
    { symbol: "IO", name: "io.net", price: "$1.30", change: 6.26 },
    { symbol: "WEN", name: "Wen", price: "$0.0000284", change: 6.16 },
    { symbol: "DRIFT", name: "Drift", price: "$0.6719", change: 5.89 },
];

const POPULAR: QuickToken[] = [
    { symbol: "SOL", name: "Solana", price: "$169.55", change: 2.08 },
    { symbol: "SONIC", name: "Sonic", price: "$0.29621", change: 2.2 },
    { symbol: "ETH", name: "Ethereum", price: "$2,690.81", change: 0.31 },
    { symbol: "BTC", name: "Bitcoin", price: "$95,930.90", change: 0.38 },
    { symbol: "USDT", name: "Tether", price: "$0.9998", change: 0.0 },
];

const MARKET_ROWS: MarketRow[] = [
    {
        symbol: "BTC",
        name: "Bitcoin",
        price: "$95,930.90",
        marketCap: "$1.9T",
        volume24h: "$284.4K",
        change24h: 0.38,
        spark: [40, 42, 41, 45, 44, 47, 49],
    },
    {
        symbol: "ETH",
        name: "Ethereum",
        price: "$2,690.81",
        marketCap: "$324B",
        volume24h: "$1.4M",
        change24h: 0.31,
        spark: [38, 36, 39, 37, 41, 40, 43],
    },
    {
        symbol: "USDT",
        name: "Tether",
        price: "$0.9998",
        marketCap: "$141.9B",
        volume24h: "$857.7M",
        change24h: 0.0,
        spark: [30, 30, 31, 30, 30, 29, 30],
    },
    {
        symbol: "SOL",
        name: "Solana",
        price: "$169.55",
        marketCap: "$79.6B",
        volume24h: "$612.2M",
        change24h: 2.08,
        spark: [22, 24, 23, 27, 26, 29, 32],
    },
    {
        symbol: "JTO",
        name: "Jito",
        price: "$2.94",
        marketCap: "$401.2M",
        volume24h: "$18.9M",
        change24h: 11.96,
        spark: [15, 16, 15, 18, 22, 26, 33],
    },
];

// ---------------------------------------------------------------------------
// Small helpers
// ---------------------------------------------------------------------------

const ChangeTag: React.FC<{ value: number }> = ({ value }) => {
    const positive = value > 0;
    const flat = value === 0;
    return (
        <span
            className={`font-body text-xs font-medium tabular-nums ${flat ? "text-white/40" : positive ? "text-emerald-400" : "text-rose-400"
                }`}
        >
            {flat ? "" : positive ? "+" : ""}
            {value.toFixed(2)}%
        </span>
    );
};

const Sparkline: React.FC<{ points: number[]; positive: boolean }> = ({ points, positive }) => {
    const w = 88;
    const h = 32;
    const max = Math.max(...points);
    const min = Math.min(...points);
    const range = max - min || 1;
    const step = w / (points.length - 1);
    const path = points
        .map((p, i) => {
            const x = i * step;
            const y = h - ((p - min) / range) * h;
            return `${i === 0 ? "M" : "L"}${x.toFixed(1)},${y.toFixed(1)}`;
        })
        .join(" ");

    return (
        <svg viewBox={`0 0 ${w} ${h}`} className="h-8 w-[88px]" fill="none">
            <path
                d={path}
                stroke={positive ? "#34d399" : "#fb7185"}
                strokeWidth="1.6"
                strokeLinecap="round"
                strokeLinejoin="round"
            />
        </svg>
    );
};

// Abstract vector banner artwork — geometric "vault door" motif built from
// concentric arcs, radial ticks and floating coin shapes. Original vector,
// no third-party imagery.
const BannerArtwork: React.FC = () => (
    <svg viewBox="0 0 480 320" className="absolute inset-y-0 right-0 h-full w-auto opacity-90" fill="none">
        <defs>
            <radialGradient id="vaultGlow" cx="70%" cy="45%" r="60%">
                <stop offset="0%" stopColor="#ffb37a" stopOpacity="0.55" />
                <stop offset="100%" stopColor="#ff7a45" stopOpacity="0" />
            </radialGradient>
            <linearGradient id="ringStroke" x1="0" y1="0" x2="1" y2="1">
                <stop offset="0%" stopColor="#ffb37a" />
                <stop offset="100%" stopColor="#ff7a45" />
            </linearGradient>
        </defs>

        <circle cx="340" cy="150" r="170" fill="url(#vaultGlow)" />

        {[150, 118, 86].map((r, i) => (
            <circle
                key={r}
                cx="340"
                cy="150"
                r={r}
                stroke="url(#ringStroke)"
                strokeOpacity={0.35 - i * 0.08}
                strokeWidth="1.4"
                strokeDasharray={i === 1 ? "2 6" : undefined}
            />
        ))}

        {/* radial ticks like a vault dial */}
        {Array.from({ length: 24 }).map((_, i) => {
            const angle = (i / 24) * Math.PI * 2;
            const r1 = 150;
            const r2 = i % 3 === 0 ? 162 : 156;
            const x1 = 340 + r1 * Math.cos(angle);
            const y1 = 150 + r1 * Math.sin(angle);
            const x2 = 340 + r2 * Math.cos(angle);
            const y2 = 150 + r2 * Math.sin(angle);
            return (
                <line
                    key={i}
                    x1={x1}
                    y1={y1}
                    x2={x2}
                    y2={y2}
                    stroke="#ffb37a"
                    strokeOpacity="0.5"
                    strokeWidth="1.2"
                />
            );
        })}

        {/* floating coin discs */}
        <g>
            <circle cx="260" cy="70" r="22" fill="#0f0f13" stroke="#ff7a45" strokeWidth="1.4" />
            <circle cx="260" cy="70" r="13" stroke="#ffb37a" strokeWidth="1.2" />
        </g>
        <g>
            <circle cx="430" cy="230" r="17" fill="#0f0f13" stroke="#ff7a45" strokeWidth="1.4" />
            <circle cx="430" cy="230" r="9" stroke="#ffb37a" strokeWidth="1.2" />
        </g>
        <g>
            <circle cx="410" cy="60" r="10" fill="#ff7a45" fillOpacity="0.8" />
        </g>

        {/* candlestick-style bars near the base */}
        {[
            { x: 300, h: 40 },
            { x: 316, h: 66 },
            { x: 332, h: 30 },
            { x: 348, h: 54 },
            { x: 364, h: 42 },
        ].map((bar, i) => (
            <rect
                key={i}
                x={bar.x}
                y={260 - bar.h}
                width="8"
                height={bar.h}
                rx="2"
                fill={i % 2 === 0 ? "#ff7a45" : "#ffb37a"}
                fillOpacity="0.85"
            />
        ))}
    </svg>
);

// ---------------------------------------------------------------------------
// Nav
// ---------------------------------------------------------------------------

const TopNav: React.FC = () => (
    <header className="border-b border-white/10 bg-[#0a0a0d]">
        <nav className="mx-auto flex max-w-[1400px] items-center gap-8 px-6 py-3.5 lg:px-10">
            <Link to="/" className="flex items-center gap-2">
                <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-[#ff7a45]">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-[#0a0a0d]">
                        <path d="M12 2 4 6v6c0 5 3.4 8.4 8 9 4.6-.6 8-4 8-9V6l-8-4Z" fill="currentColor" />
                    </svg>
                </div>
                <span className="font-display text-base font-semibold tracking-tight text-white">
                    Vaultline
                </span>
            </Link>

            <div className="hidden items-center gap-6 lg:flex">
                {["Spot", "Futures", "Lend"].map((item) => (
                    <a key={item} href="#" className="font-body text-sm text-white/70 hover:text-white">
                        {item}
                    </a>
                ))}
                <button className="flex items-center gap-1 font-body text-sm text-white/70 hover:text-white">
                    More
                    <svg viewBox="0 0 24 24" fill="none" className="h-3.5 w-3.5">
                        <path d="m6 9 6 6 6-6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                </button>
            </div>

            <div className="ml-auto flex flex-1 items-center gap-4 lg:flex-none lg:ml-6">
                <div className="hidden max-w-xs flex-1 items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 lg:flex">
                    <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4 text-white/40">
                        <circle cx="11" cy="11" r="7" stroke="currentColor" strokeWidth="1.6" />
                        <path d="m21 21-4-4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" />
                    </svg>
                    <span className="font-body text-sm text-white/40">Search markets</span>
                    <span className="ml-auto rounded border border-white/10 px-1.5 py-0.5 font-mono text-[10px] text-white/30">
                        /
                    </span>
                </div>
            </div>

            <div className="flex items-center gap-2">
                <button className="rounded-lg bg-[#ff7a45] px-4 py-1.5 font-body text-sm font-semibold text-[#0a0a0d] hover:brightness-105">
                    Sign up
                </button>
                <button className="rounded-lg border border-white/15 px-4 py-1.5 font-body text-sm font-semibold text-white/85 hover:border-white/30">
                    Sign in
                </button>
            </div>
        </nav>
    </header>
);

// ---------------------------------------------------------------------------
// Banner carousel
// ---------------------------------------------------------------------------

const SLIDES = [
    {
        eyebrow: "Referrals",
        title: "Refer and earn",
        body: "Refer a friend and earn a percentage of their trading fees.",
        cta: "Manage referrals",
    },
    {
        eyebrow: "Launch week",
        title: "Zero fees on new listings",
        body: "Trade the first five markets of every listing week with no taker fee.",
        cta: "View listings",
    },
];

const BannerCarousel: React.FC = () => {
    const [index, setIndex] = useState(0);
    const slide = SLIDES[index];

    const go = (dir: 1 | -1) =>
        setIndex((i) => (i + dir + SLIDES.length) % SLIDES.length);

    return (
        <div className="relative overflow-hidden rounded-2xl border border-white/10 bg-[#0f0f13]">
            <BannerArtwork />

            <div className="relative z-10 flex min-h-[220px] flex-col justify-center px-8 py-10 lg:px-12">
                <span className="font-body text-xs font-medium uppercase tracking-widest text-[#ff7a45]">
                    {slide.eyebrow}
                </span>
                <h2 className="mt-3 max-w-md font-display text-4xl font-semibold tracking-tight text-white">
                    {slide.title}
                </h2>
                <p className="mt-2 max-w-sm font-body text-sm text-white/60">{slide.body}</p>
                <button className="mt-6 w-fit rounded-lg bg-white px-5 py-2.5 font-body text-sm font-semibold text-[#0a0a0d] hover:bg-white/90">
                    {slide.cta}
                </button>
            </div>

            <button
                onClick={() => go(-1)}
                aria-label="Previous slide"
                className="absolute left-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/50"
            >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="m15 6-6 6 6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>
            <button
                onClick={() => go(1)}
                aria-label="Next slide"
                className="absolute right-3 top-1/2 z-10 flex h-8 w-8 -translate-y-1/2 items-center justify-center rounded-full bg-black/30 text-white/70 hover:bg-black/50"
            >
                <svg viewBox="0 0 24 24" fill="none" className="h-4 w-4">
                    <path d="m9 6 6 6-6 6" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
            </button>

            <div className="absolute bottom-4 left-1/2 z-10 flex -translate-x-1/2 gap-1.5">
                {SLIDES.map((_, i) => (
                    <button
                        key={i}
                        onClick={() => setIndex(i)}
                        aria-label={`Go to slide ${i + 1}`}
                        className={`h-1.5 rounded-full transition-all ${i === index ? "w-5 bg-[#ff7a45]" : "w-1.5 bg-white/25"
                            }`}
                    />
                ))}
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Quick-list panel (New / Top gainers / Popular)
// ---------------------------------------------------------------------------

const QuickListPanel: React.FC<{ title: string; tokens: QuickToken[] }> = ({ title, tokens }) => (
    <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-5">
        <h3 className="font-body text-sm font-medium text-white/80">{title}</h3>
        <div className="mt-3 divide-y divide-white/5">
            {tokens.map((t) => (
                <div key={t.symbol} className="flex items-center justify-between py-2.5">
                    <div className="flex items-center gap-2.5">
                        <div className="flex h-6 w-6 items-center justify-center rounded-full bg-white/10 font-body text-[10px] font-semibold text-white/70">
                            {t.symbol.slice(0, 1)}
                        </div>
                        <span className="font-body text-sm text-white/85">{t.symbol}</span>
                    </div>
                    <div className="flex items-center gap-3">
                        <span className="font-body text-sm text-white/70 tabular-nums">{t.price}</span>
                        <ChangeTag value={t.change} />
                    </div>
                </div>
            ))}
        </div>
    </div>
);

// ---------------------------------------------------------------------------
// Market table
// ---------------------------------------------------------------------------

const MarketTable: React.FC = () => {
    const [tab, setTab] = useState<MarketTab>("Spot");

    return (
        <div className="rounded-2xl border border-white/10 bg-white/[0.02]">
            <div className="flex items-center gap-1 border-b border-white/10 px-5 pt-4">
                {(["Spot", "Futures", "Lending"] as MarketTab[]).map((t) => (
                    <button
                        key={t}
                        onClick={() => setTab(t)}
                        className={`rounded-t-lg px-3 pb-3 font-body text-sm font-medium transition-colors ${tab === t ? "text-white border-b-2 border-[#ff7a45]" : "text-white/45 hover:text-white/70"
                            }`}
                    >
                        {t}
                    </button>
                ))}
            </div>

            <div className="overflow-x-auto">
                <table className="w-full min-w-[640px] border-collapse">
                    <thead>
                        <tr className="font-body text-xs text-white/40">
                            <th className="px-5 py-3 text-left font-medium">Name</th>
                            <th className="px-5 py-3 text-right font-medium">Price</th>
                            <th className="px-5 py-3 text-right font-medium">Market cap</th>
                            <th className="px-5 py-3 text-right font-medium">24h volume</th>
                            <th className="px-5 py-3 text-right font-medium">24h change</th>
                            <th className="px-5 py-3 text-right font-medium">Last 7 days</th>
                        </tr>
                    </thead>
                    <tbody>
                        {MARKET_ROWS.map((row) => (
                            <tr key={row.symbol} className="border-t border-white/5 hover:bg-white/[0.03]">
                                <td className="px-5 py-3.5">
                                    <div className="flex items-center gap-3">
                                        <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 font-body text-[10px] font-semibold text-white/70">
                                            {row.symbol.slice(0, 1)}
                                        </div>
                                        <div>
                                            <div className="font-body text-sm text-white/90">{row.name}</div>
                                            <div className="font-body text-xs text-white/40">{row.symbol}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-5 py-3.5 text-right font-body text-sm text-white/85 tabular-nums">
                                    {row.price}
                                </td>
                                <td className="px-5 py-3.5 text-right font-body text-sm text-white/60 tabular-nums">
                                    {row.marketCap}
                                </td>
                                <td className="px-5 py-3.5 text-right font-body text-sm text-white/60 tabular-nums">
                                    {row.volume24h}
                                </td>
                                <td className="px-5 py-3.5 text-right">
                                    <ChangeTag value={row.change24h} />
                                </td>
                                <td className="px-5 py-3.5">
                                    <div className="flex justify-end">
                                        <Sparkline points={row.spark} positive={row.change24h >= 0} />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
};

// ---------------------------------------------------------------------------
// Root export
// ---------------------------------------------------------------------------

interface MarketHeroProps {
    /** Render without the top nav / full-page background, for nesting inside another page. */
    embedded?: boolean;
}

const MarketHero: React.FC<MarketHeroProps> = ({ embedded = false }) => {
    const body = (
        <main className={embedded ? "mx-auto max-w-[1400px]" : "mx-auto max-w-[1400px] px-6 py-8 lg:px-10"}>
            <BannerCarousel />

            <div className="mt-6 grid gap-5 md:grid-cols-3">
                <QuickListPanel title="New" tokens={NEW_TOKENS} />
                <QuickListPanel title="Top gainers" tokens={TOP_GAINERS} />
                <QuickListPanel title="Popular" tokens={POPULAR} />
            </div>

            <div className="mt-6">
                <MarketTable />
            </div>
        </main>
    );

    if (embedded) {
        return <div className="font-body text-white">{body}</div>;
    }

    return (
        <div className="min-h-screen bg-[#0a0a0d] font-body text-white antialiased">
            <TopNav />
            {body}
        </div>
    );
};

export default MarketHero;