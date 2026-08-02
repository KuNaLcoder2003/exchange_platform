import { createClient } from "redis";
import { matchBuyOrder, matchSellOrders, type Order } from "./helpers/orders.js";

export const redisClient = createClient()

async function getOrders() {
    await redisClient.connect()
    while (1) {
        const order = await redisClient.brPop('orders', 0)

        let orderbook = await redisClient.get('orderBook')
        if (orderbook) {
            const array = [...JSON.parse(orderbook) as any, JSON.parse(order?.element!)]
            await redisClient.set('orderBook', JSON.stringify(array))
        } else {
            await redisClient.set('orderBook', JSON.stringify([JSON.parse(order?.element!)]))
        }
        const orders = await redisClient.get('orderBook')

        await redisClient.publish('OrderBookUpdated', JSON.stringify(orders))
        const parsedOrder = JSON.parse(order?.element!) as Order

        switch (parsedOrder.side) {
            case "SELL":
                await matchSellOrders(parsedOrder)
                break;

            case "BUY":
                await matchBuyOrder(parsedOrder)
                break;
        }

    }
}

getOrders()