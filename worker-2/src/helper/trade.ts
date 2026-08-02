
import { prisma, type DbClient } from "../../../primary-backend/dist/db.js"
import { Decimal } from "@prisma/client/runtime/client"
import type { OrderStatus } from "../index.js"



export type Trade = {
    buy_order_id: string
    sell_order_id: string
    price: Number
    qunatity: Number
    buy_quantity_remaining: Number
    sell_quantity_remaining: Number
    matched_order_email: string
}
export async function createTrade(tardeObject: Trade) {
    return prisma.$transaction(async (tx) => {
        const tarde = await tx.trade.create({
            data: {
                price: new Decimal(Number(tardeObject.price)),
                quantity: new Decimal(Number(tardeObject.qunatity)),
                buy_order_id: tardeObject.buy_order_id,
                sell_order_id: tardeObject.sell_order_id
            }
        })

        return tarde
    }, { maxWait: 5000, timeout: 10000 })
}


export async function updateOrder(order_id: string, remaining_quantity: Decimal, status: OrderStatus) {
    return prisma.$transaction(async (tx) => {
        const updated_order = await prisma.orders.update({
            where: {
                id: order_id
            },
            data: {
                status: status,
                remaining_quantity: remaining_quantity
            }
        })
        return updated_order
    }, { maxWait: 5000, timeout: 10000 })
}
