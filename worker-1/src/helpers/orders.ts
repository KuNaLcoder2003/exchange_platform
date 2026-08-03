import { redisClient } from "../index.js"

type Trade = {
    buy_order_id: string
    sell_order_id: string
    price: Number
    qunatity: Number
    buy_quantity_remaining: Number
    sell_quantity_remaining: Number
    matched_order_email: string
}

type OrderStatus =
    "PENDING" |
    "PARTIALLY_FILLED" |
    "FILLED" |
    "CANCELLED" |
    "REJECTED"


export type Order = {
    id: string
    idempotency_key: string
    status: OrderStatus
    quantity: string
    remaining_quantity: string
    price: string
    side: 'SELL' | 'BUY'
    type: 'LIMIT_ORDER' | 'MARKET_ORDER'
    created_at: Date,
    updated_at: Date
    user_id: string
    email: string
}

export async function matchSellOrders(incomingOrder: Order) {
    console.log('Matching a Sell order')
    // firstly get all the current buy orders from the in memory orderbook
    const cache_respone = await redisClient.get('orderBook')


    const orderBook = JSON.parse(cache_respone!) as Order[]

    console.log(orderBook)

    const buyOrders = orderBook.filter((order) => order.side == 'BUY') as Order[]

    buyOrders.sort((a, b) => {
        const priceDiff = Number(b.price) - Number(a.price); // Highest price first

        if (priceDiff !== 0) {
            return priceDiff;
        }

        // Same price -> oldest order first
        return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
    });


    let copyObject = { ...incomingOrder }

    // now the matching algo
    let matched_arr: Trade[] = []
    let completely_matches_buy_orders: Order[] = []
    // console.log('Buy orders array : \n', buyOrders)
    // console.log('\n')
    let sellOrder_completely_matched: boolean = false
    for (let i = 0; i < buyOrders.length; i++) {
        if (copyObject.user_id == buyOrders[i]!.user_id) {
            continue
        }

        let trade!: Trade
        if (Number(buyOrders[i]?.price) >= Number(copyObject.price)) {
            let buy_quantity = Number(buyOrders[i]?.remaining_quantity) // buy
            let sell_quantity = Number(copyObject.remaining_quantity) // sell
            let qunatity_traded = 0;
            if (buy_quantity > sell_quantity) {
                qunatity_traded = sell_quantity
                buy_quantity = buy_quantity - sell_quantity
                sell_quantity = 0;
                buyOrders[i]!.status = "PARTIALLY_FILLED"
            } else if (buy_quantity < sell_quantity) {

                qunatity_traded = buy_quantity
                sell_quantity = sell_quantity - buy_quantity
                buy_quantity = 0
                copyObject.status = "PARTIALLY_FILLED"
                completely_matches_buy_orders.push(buyOrders[i]!)
                buyOrders[i]!.status = "FILLED"
            } else {
                qunatity_traded = buy_quantity
                buy_quantity = 0
                sellOrder_completely_matched = true
                sell_quantity = 0
                completely_matches_buy_orders.push(buyOrders[i]!);
                // copyObject.status = "FILLED"
                buyOrders[i]!.status = "FILLED"
            }

            buyOrders[i]!.remaining_quantity = `${buy_quantity}`;
            // update the order book also at the same time
            copyObject.remaining_quantity = `${sell_quantity}`;
            trade = {
                buy_order_id: buyOrders[i]!?.id,
                sell_order_id: incomingOrder.id,
                qunatity: qunatity_traded,
                matched_order_email: buyOrders[i]!.email,
                price: Number(buyOrders[i]!.price),
                buy_quantity_remaining: Number(buyOrders[i]!.remaining_quantity),
                sell_quantity_remaining: Number(copyObject.remaining_quantity)
            }
            matched_arr.push(trade)
            if (sell_quantity == 0) {
                sellOrder_completely_matched = true
                copyObject.status = "FILLED"
                break
            }
        }
    }

    let updatedOrderBook = orderBook.map(order => {
        // making an array of the updated orders
        const updated = buyOrders.find(b => b.id === order.id);
        // if updated found then return updated , if not then return non updated order
        return updated ?? order;
    }).filter(order => !completely_matches_buy_orders.some(o => o.id === order.id));

    if (!sellOrder_completely_matched) {

        updatedOrderBook = updatedOrderBook.map(obj => {
            if (obj.id == copyObject.id) {
                return copyObject
            } else {
                return obj
            }
        });
    } else {
        updatedOrderBook = updatedOrderBook.filter(order => order.id != copyObject.id)
    }
    // updating the order book
    await redisClient.set("orderBook", JSON.stringify(updatedOrderBook));
    await redisClient.publish('OrderBookUpdated', JSON.stringify(updatedOrderBook))
    let final_trade_object = {
        email: copyObject.email,
        trades: matched_arr,
        event: "TradeExecuted",
        orderSide: copyObject.side,
        orderId: copyObject.id,
        orderStatus: copyObject.status,
        remaining_quantity: Number(copyObject.remaining_quantity)
    }
    await redisClient.publish("TradeExecuted", JSON.stringify(final_trade_object))
}

export async function matchBuyOrder(incomingOrder: Order) {
    console.log('Matching a buy order')
    // firstly get all the current buy orders from the in memory orderbook
    const cache_respone = await redisClient.get('orderBook')


    const orderBook = JSON.parse(cache_respone!) as Order[]

    const sellOrders = orderBook.filter((order) => order.side == 'SELL') as Order[]

    sellOrders.sort((a, b) => {
        const priceDiff = Number(a.price) - Number(b.price); // Lowest price first

        if (priceDiff !== 0) {
            return priceDiff;
        }

        // Same price -> oldest order first
        return (
            new Date(a.created_at).getTime() -
            new Date(b.created_at).getTime()
        );
    });

    let copyObject = { ...incomingOrder }

    // now the matching algo
    let matched_arr: Trade[] = []
    let completely_matches_sell_orders: Order[] = []
    let buyOrder_completely_matched: boolean = false
    for (let i = 0; i < sellOrders.length; i++) {

        if (copyObject.user_id == sellOrders[i]!.user_id) {
            continue
        }

        let trade!: Trade
        if (Number(sellOrders[i]?.price) <= Number(copyObject.price)) {
            let sell_quantity = Number(sellOrders[i]?.remaining_quantity) // sell
            let buy_quantity = Number(copyObject.remaining_quantity) // buys
            let qunatity_traded = 0;
            if (buy_quantity > sell_quantity) {
                console.log('BUY QUANTS > SELL QUANTS')
                qunatity_traded = sell_quantity
                buy_quantity = buy_quantity - sell_quantity
                sell_quantity = 0;
                copyObject.status = "PARTIALLY_FILLED"
                sellOrders[i]!.status = "FILLED"
                completely_matches_sell_orders.push(sellOrders[i]!)
            } else if (buy_quantity < sell_quantity) {
                console.log('BUY QUANTS < SELL QUANTS')
                qunatity_traded = buy_quantity
                sell_quantity = sell_quantity - buy_quantity
                buy_quantity = 0
                copyObject.status = "FILLED"
                sellOrders[i]!.status = "PARTIALLY_FILLED"
            } else {
                console.log('EQUAL')
                qunatity_traded = buy_quantity
                buy_quantity = 0
                sell_quantity = 0
                sellOrders[i]!.status = "FILLED"
                completely_matches_sell_orders.push(sellOrders[i]!)
                buyOrder_completely_matched = true
                copyObject.status = "FILLED"
            }

            sellOrders[i]!.remaining_quantity = `${sell_quantity}`
            copyObject.remaining_quantity = `${buy_quantity}`;
            trade = {
                buy_order_id: copyObject.id,
                sell_order_id: sellOrders[i]!.id,
                qunatity: qunatity_traded,
                matched_order_email: sellOrders[i]!.email,
                price: Number(sellOrders[i]!.price),
                buy_quantity_remaining: Number(copyObject.remaining_quantity),
                sell_quantity_remaining: Number(sellOrders[i]!.remaining_quantity)
            }
            matched_arr.push(trade)
            if (buy_quantity == 0) {
                console.log('Here')
                buyOrder_completely_matched = true
                break;
            }
        }
    }

    let updatedOrderBook = orderBook.map(
        (order) => {
            // finding the updates sell orders

            const updated = sellOrders.find(o => o.id == order.id)

            // returning the updated sell order , if found , if not then returning the non upated sell order
            return updated ?? order
        }
    ).filter((o) => !completely_matches_sell_orders.some(obj => obj.id == o.id)) // for filtering out the non completely matched sell order

    if (!buyOrder_completely_matched) {
        // if buy order is not completely full filled , then push to order book
        updatedOrderBook = updatedOrderBook.map(obj => {
            if (obj.id == copyObject.id) {
                return copyObject
            } else {
                return obj
            }
        });
    } else {
        updatedOrderBook = updatedOrderBook.filter(order => order.id !== copyObject.id)
    }
    await redisClient.set('orderBook', JSON.stringify(updatedOrderBook))
    await redisClient.publish('OrderBookUpdated', JSON.stringify(updatedOrderBook))

    let final_trade_object = {
        email: copyObject.email,
        trades: matched_arr,
        event: "TradeExecuted",
        orderSide: copyObject.side,
        orderId: copyObject.id,
        orderStatus: copyObject.status
    }
    // console.log(final_trade_object)
    await redisClient.publish("TradeExecuted", JSON.stringify(final_trade_object))
}