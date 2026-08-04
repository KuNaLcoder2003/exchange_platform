
import { createClient } from "redis"
import { updateWallet } from "./helper/wallet.js"

const rediClient = createClient()
await rediClient.connect()

export type Trade = {
    buy_order_id: string
    sell_order_id: string
    price: Number
    qunatity: Number
    buy_quantity_remaining: Number
    sell_quantity_remaining: Number
    matched_order_email: string
    matched_user_id: string
}
export type OrderStatus =
    "PENDING" |
    "PARTIALLY_FILLED" |
    "FILLED" |
    "CANCELLED" |
    "REJECTED"

type TradeSubscribed = {
    trades: Trade[];
    event: string;
    email: string;
    orderSide: "SELL" | "BUY";
    orderId: string;
    orderStatus: OrderStatus
    remaining_quantity: Number
    user_id: string
}

async function pickWalletJobs() {
    try {
        let trade_object!: TradeSubscribed
        await rediClient.subscribe('TradeExecuted', async (message) => {
            trade_object = JSON.parse(message) as TradeSubscribed
            const trades = trade_object.trades
            const amount = trades.reduce((a, b) => Number(a) + Number(b.price) * Number(b.qunatity), 0)
            const side = trade_object.orderSide
            if (side == "BUY") {
                await updateWallet(trade_object.user_id, amount, "BUY")

                const result = await Promise.allSettled(trades.map(async (trade) => {
                    return await updateWallet(trade.matched_user_id, -(Number(trade.price) * Number(trade.qunatity)), "SELL")
                }))
                result.map(async (res, index) => {
                    if (res.status == "rejected") {
                        await rediClient.lPush('WALLET_UPDATE_RETRY', JSON.stringify(trades[index]))
                    }
                })

            } else {
                await updateWallet(trade_object.user_id, -Number(amount), "SELL")

                const result = await Promise.allSettled(trades.map(async (trade) => {
                    return await updateWallet(trade.matched_user_id, (Number(trade.price) * Number(trade.qunatity)), "BUY")
                }))
                result.map(async (res, index) => {
                    if (res.status == "rejected") {
                        await rediClient.lPush('WALLET_UPDATE_RETRY', JSON.stringify(trades[index]))
                    }
                })
            }


        })

    } catch (error) {
        console.log(error)
    }
}

pickWalletJobs()
export { rediClient }