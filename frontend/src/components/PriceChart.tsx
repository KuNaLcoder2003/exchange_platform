/**
 * PriceChart.tsx
 * -----------------------------------------------------------------------
 * A gridded price chart with timeframe tabs, in the Vaultline theme.
 * Pure SVG, no charting library — generates a smooth path from a series
 * of close prices so it's easy to swap in real candle/kline data later.
 * -----------------------------------------------------------------------
 */

import React, { useMemo, useState } from "react";

type Timeframe = "15m" | "1H" | "4H" | "1D" | "1W";

interface PriceChartProps {
    pair?: string;
    /** Optional real data: an array of closing prices, oldest first. Falls back to a mock series. */
    series?: number[];
}

const TIMEFRAMES: Timeframe[] = ["15m", "1H", "4H", "1D", "1W"];

// Deterministic-looking mock series (no Math.random so it's stable across renders/SSR).
function mockSeries(points = 48, base = 160): number[] {
    const out: number[] = [];
    let v = base;
    for (let i = 0; i < points; i++) {
        const wave = Math.sin(i / 5) * 4 + Math.sin(i / 13) * 6;
        const drift = i * 0.18;
        v = base + wave + drift;
        out.push(Number(v.toFixed(2)));
    }
    return out;
}

/** Builds a smooth-ish SVG path from a series of values, mapped into a w×h viewport. */
function buildPath(values: number[], w: number, h: number, padding = 8) {
    const max = Math.max(...values);
    const min = Math.min(...values);
    const range = max - min || 1;
    const step = (w - padding * 2) / (values.length - 1);

    const points = values.map((v, i) => ({
        x: padding + i * step,
        y: padding + (1 - (v - min) / range) * (h - padding * 2),
    }));

    let d = `M${points[0].x.toFixed(1)},${points[0].y.toFixed(1)}`;
    for (let i = 1; i < points.length; i++) {
        const prev = points[i - 1];
        const curr = points[i];
        const midX = (prev.x + curr.x) / 2;
        d += ` C${midX.toFixed(1)},${prev.y.toFixed(1)} ${midX.toFixed(1)},${curr.y.toFixed(1)} ${curr.x.toFixed(1)},${curr.y.toFixed(1)}`;
    }

    return { d, points, max, min };
}

const PriceChart: React.FC<PriceChartProps> = ({ pair = "SOL/USDC", series }) => {
    const [timeframe, setTimeframe] = useState<Timeframe>("1H");
    const data = useMemo(() => series ?? mockSeries(48), [series]);

    const W = 760;
    const H = 320;
    const PAD = 28;

    const { d, max, min } = useMemo(() => buildPath(data, W, H, PAD), [data]);

    const last = data[data.length - 1];
    const first = data[0];
    const changePct = ((last - first) / first) * 100;
    const positive = changePct >= 0;

    const gridLines = 4;

    return (
        <div className="flex h-full flex-col rounded-2xl border border-white/10 bg-[#0f0f13]">
            {/* header */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-5 py-4">
                <div>
                    <div className="flex items-center gap-2">
                        <span className="font-display text-xl font-semibold text-white">{last.toFixed(2)}</span>
                        <span className={`font-body text-xs font-medium ${positive ? "text-emerald-400" : "text-rose-400"}`}>
                            {positive ? "+" : ""}
                            {changePct.toFixed(2)}%
                        </span>
                    </div>
                    <p className="mt-0.5 font-body text-xs text-white/40">{pair} · mark price</p>
                </div>

                <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.03] p-1">
                    {TIMEFRAMES.map((tf) => (
                        <button
                            key={tf}
                            onClick={() => setTimeframe(tf)}
                            className={`rounded-md px-2.5 py-1 font-body text-xs font-medium transition-colors ${timeframe === tf ? "bg-[#ff7a45] text-[#0a0a0d]" : "text-white/50 hover:text-white/80"
                                }`}
                        >
                            {tf}
                        </button>
                    ))}
                </div>
            </div>

            {/* chart */}
            <div className="flex-1 p-4">
                <svg viewBox={`0 0 ${W} ${H}`} className="h-full w-full" preserveAspectRatio="none">
                    <defs>
                        <linearGradient id="priceStroke" x1="0" y1="0" x2="1" y2="0">
                            <stop offset="0%" stopColor="#ffb37a" />
                            <stop offset="100%" stopColor="#ff7a45" />
                        </linearGradient>
                        <linearGradient id="priceFill" x1="0" y1="0" x2="0" y2="1">
                            <stop offset="0%" stopColor="#ff7a45" stopOpacity="0.28" />
                            <stop offset="100%" stopColor="#ff7a45" stopOpacity="0" />
                        </linearGradient>
                    </defs>

                    {/* horizontal gridlines + price labels */}
                    {Array.from({ length: gridLines + 1 }).map((_, i) => {
                        const y = PAD + (i / gridLines) * (H - PAD * 2);
                        const price = max - (i / gridLines) * (max - min);
                        return (
                            <g key={i}>
                                <line x1={PAD} y1={y} x2={W - PAD} y2={y} stroke="#ffffff" strokeOpacity="0.05" strokeWidth="1" />
                                <text x={W - 4} y={y - 4} textAnchor="end" fontSize="10" fill="rgba(255,255,255,0.35)">
                                    {price.toFixed(1)}
                                </text>
                            </g>
                        );
                    })}

                    {/* fill + line */}
                    <path d={`${d} L${W - PAD},${H - PAD} L${PAD},${H - PAD} Z`} fill="url(#priceFill)" />
                    <path d={d} fill="none" stroke="url(#priceStroke)" strokeWidth="2" strokeLinecap="round" />
                </svg>
            </div>
        </div>
    );
};

export default PriceChart;