/**
 * LiveOrderBook.tsx
 * -----------------------------------------------------------------------
 * Drop-in replacement for the old:
 *
 *   const [socket, setSocket] = useState<WebSocket | null>(null)
 *   const [orders, setOrders] = useState<Order[]>([])
 *   useEffect(() => { ...new WebSocket('ws://localhost:8080')... }, [])
 *   if (!socket) return <div>Connecting......</div>
 *
 * Same connection logic (see useOrderBookSocket.ts), just themed and with
 * auto-reconnect + an error state instead of hanging on "Connecting......"
 * forever if the socket drops.
 *
 * Usage:
 *   <LiveOrderBook wsUrl="ws://localhost:8080" pair="SOL/USDC" />
 * -----------------------------------------------------------------------
 */

import React from "react";
import OrderBook from "./OrderBook";
import { useOrderBookSocket } from "../hooks/useOrderBookSocket";

interface LiveOrderBookProps {
    wsUrl?: string;
    pair?: string;
    currency?: string;
}

const LiveOrderBook: React.FC<LiveOrderBookProps> = ({
    wsUrl = "ws://localhost:8080",
    pair = "SOL/USDC",
    currency,
}) => {
    const { orders, status } = useOrderBookSocket({ url: wsUrl });

    // First connect, nothing received yet.
    if (status === "connecting" && orders.length === 0) {
        return (
            <div className="flex w-full max-w-sm flex-col items-center justify-center gap-3 rounded-2xl border border-white/10 bg-[#0f0f13] py-16 font-body text-white">
                <span className="h-2 w-2 animate-pulse rounded-full bg-[#ff7a45]" />
                <p className="text-sm text-white/50">Connecting to order book…</p>
            </div>
        );
    }

    // Errored out before ever getting data — auto-reconnect is still running in the background.
    if (status === "error" && orders.length === 0) {
        return (
            <div className="flex w-full max-w-sm flex-col items-center justify-center gap-2 rounded-2xl border border-rose-500/20 bg-[#0f0f13] py-16 font-body text-white">
                <p className="text-sm text-rose-400">Couldn't reach the order book feed.</p>
                <p className="text-xs text-white/40">Retrying…</p>
            </div>
        );
    }

    // Connected (or was connected and now reconnecting) — keep the last known book on screen,
    // the dot in the header reflects the live status.
    return <OrderBook orders={orders} pair={pair} currency={currency} connectionStatus={status} />;
};

export default LiveOrderBook;