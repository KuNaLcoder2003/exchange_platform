type OrderStatus = "PENDING" | "PARTIALLY_FILLED" | "FILLED" | "CANCELLED" | "REJECTED";
export type Order = {
    id: string;
    idempotency_key: string;
    status: OrderStatus;
    quantity: string;
    remaining_quantity: string;
    price: string;
    side: 'SELL' | 'BUY';
    type: 'LIMIT_ORDER' | 'MARKET_ORDER';
    created_at: Date;
    updated_at: Date;
    user_id: string;
};
export {};
//# sourceMappingURL=index.d.ts.map