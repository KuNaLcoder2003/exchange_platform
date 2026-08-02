/**
 * useOrderBookSocket.ts
 * -----------------------------------------------------------------------
 * WebSocket hook for the live order book feed. Based directly on the
 * connect/onmessage/cleanup logic sketched out in the commented block —
 * just wrapped as a reusable hook, with auto-reconnect and a status flag
 * so the UI can show "connecting" / "live" / "disconnected" states
 * instead of a bare "Connecting..." string.
 * -----------------------------------------------------------------------
 */

import { useEffect, useRef, useState } from "react";
import type { Order, ConnectionStatus } from "../components/OrderBook";

interface UseOrderBookSocketOptions {
    /** e.g. "ws://localhost:8080" */
    url: string;
    /** Reconnect automatically after the socket closes or errors. Default true. */
    autoReconnect?: boolean;
    /** Delay before a reconnect attempt, in ms. Default 2000. */
    reconnectDelay?: number;
}

interface UseOrderBookSocketResult {
    orders: Order[];
    status: ConnectionStatus;
}

export function useOrderBookSocket({
    url,
    autoReconnect = true,
    reconnectDelay = 2000,
}: UseOrderBookSocketOptions): UseOrderBookSocketResult {
    const [orders, setOrders] = useState<Order[]>([]);
    const [status, setStatus] = useState<ConnectionStatus>("connecting");

    const reconnectTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
    const keepConnecting = useRef(true);

    useEffect(() => {
        keepConnecting.current = true;
        let socket: WebSocket | null = null;

        const connect = () => {
            setStatus("connecting");
            socket = new WebSocket(url);

            socket.onopen = () => {
                setStatus("open");
            };

            socket.onmessage = (message) => {
                try {
                    const data = JSON.parse(message.data) as Order[];
                    setOrders(data.length === 0 ? [] : [...data]);
                } catch (err) {
                    console.error("Order book socket: failed to parse message", err);
                }
            };

            socket.onerror = () => {
                setStatus("error");
            };

            socket.onclose = () => {
                setStatus("closed");
                if (autoReconnect && keepConnecting.current) {
                    reconnectTimer.current = setTimeout(connect, reconnectDelay);
                }
            };
        };

        connect();

        return () => {
            keepConnecting.current = false;
            if (reconnectTimer.current) clearTimeout(reconnectTimer.current);
            socket?.close();
        };
    }, [url, autoReconnect, reconnectDelay]);

    return { orders, status };
}