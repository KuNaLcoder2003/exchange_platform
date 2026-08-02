import { createClient } from "redis";
import { prisma } from "../../primary-backend/dist/db.js"
import { createTrade, updateOrder, type Trade } from "./helper/trade.js";
import { Decimal } from "@prisma/client/runtime/wasm-compiler-edge";

const redisClient = createClient()
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
}

async function pickTrades() {
    try {
        await redisClient.connect()
        console.log('Connected To Redis')
        let tarde_object!: TradeSubscribed
        await redisClient.subscribe('TradeExecuted', async (message) => {
            console.log(JSON.parse(message))
            tarde_object = JSON.parse(message) as TradeSubscribed
            if (tarde_object && tarde_object.trades.length > 0) {
                try {
                    const tardes = tarde_object.trades;
                    const result = await Promise.allSettled(tardes.map(async (trade) => {
                        return await createTrade(trade)
                    }))
                    await redisClient.lPush('MAIL_SERVICE', JSON.stringify({ event: "TRADE_EXECUTED", data: tarde_object }))
                    // get successfully created entries 
                    const success = result.filter(res => res.status == "fulfilled")
                    // unsuceessfull entries
                    console.log('Entries created', success)
                    if (tarde_object.orderSide == "BUY") {
                        await updateOrder(tarde_object.orderId, new Decimal(Number(tarde_object.remaining_quantity)), tarde_object.orderStatus)
                        let updated_sell_orders = await Promise.allSettled(tardes.map(async (trade) => {
                            return await updateOrder(trade.sell_order_id, new Decimal(Number(trade.sell_quantity_remaining)), (trade.sell_quantity_remaining > tarde_object.remaining_quantity ? "PARTIALLY_FILLED" : "FILLED"))
                        }))
                        let failed: any[] = []
                        updated_sell_orders.forEach(async (obj, index) => {
                            if (obj.status == "rejected") {
                                failed.push(tardes[index])
                                await redisClient.lPush('UNSUCCESSFULL_SELL_ORDERS', JSON.stringify(tardes[index]))
                            }
                        })
                        console.log('Failed BUY orders are : ', failed)
                    } else {
                        await updateOrder(tarde_object.orderId, new Decimal(Number(tarde_object.remaining_quantity)), tarde_object.orderStatus)
                        const updated_buy_orders = await Promise.allSettled(tardes.map(async (trade) => {
                            return await updateOrder(trade.buy_order_id, new Decimal(Number(trade.buy_quantity_remaining)), (trade.buy_quantity_remaining > tarde_object.remaining_quantity ? "PARTIALLY_FILLED" : "FILLED"))
                        }))
                        let failed: any[] = []
                        updated_buy_orders.forEach(async (obj, index) => {
                            if (obj.status == "rejected") {
                                failed.push(tardes[index])
                                await redisClient.lPush('UNSUCCESSFULL_BUY_ORDERS', JSON.stringify(tardes[index]))
                            }
                        })
                        console.log('Failed BUY orders are : ', failed)
                    }
                    // push the failed entries to retry queue

                } catch (error) {
                    console.log('Error is : ', error)
                }
            }
            else {
                console.log('Nothing to subscribe')
            }
        })

        console.log('Outside is :', tarde_object)
        // write trade entries in db


    } catch (error) {
        console.log(error)
    }
}

pickTrades()