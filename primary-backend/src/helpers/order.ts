import type { Decimal } from "@prisma/client/runtime/client"
import { prisma } from "../db.js"
import { OrderStatus, OrderSide, OrderType } from "@prisma/client"

export type OrderRequest = {
    user_id: string,
    idempotency_key: string,
    quantity: Decimal,
    price: Decimal,
    side: OrderSide,
    remaining_quantity: Decimal,
    status: OrderStatus,
    type: OrderType,
    email?: string
}

export async function createOrder(orderObject: OrderRequest) {
    const new_order = await prisma.$transaction(async (tx) => {
        const entry = await tx.orders.create({
            data: {
                user_id: orderObject.user_id,
                idempotency_key: orderObject.idempotency_key,
                quantity: orderObject.quantity,
                remaining_quantity: orderObject.remaining_quantity,
                side: orderObject.side,
                status: orderObject.status,
                type: orderObject.type,
                price: orderObject.price
            }
        })
        return entry
    }, { maxWait: 5000, timeout: 10000 })

    if (!new_order) {
        return null
    } else {
        return new_order
    }
}