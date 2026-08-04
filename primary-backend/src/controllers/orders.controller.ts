import express, { response } from "express"
import { createOrder, type OrderRequest } from "../helpers/order.js"
import { redisClient } from "../index.js"
import type { Decimal } from "@prisma/client/runtime/client"
import { Prisma } from "@prisma/client"
import { prisma } from "../db.js"

export const newOrder = async (req: any, res: express.Response) => {

    // 1. get the incoming object and enrich it
    // check wether the user has enough assest / balance to trade the required qunatity -> if not then stop the order and throw them an error
    // 2. write the enriched object to db 
    // 3. push the enriched object to queue 
    // 4. also update the in memory orderbook 
    /*---------------- Getting the incoming the object and enriching it ----------------*/
    const orderObject = req.body

    if (!orderObject) {
        res.status(400).json({
            message: "Bad request",
            valid: false
        })
        return
    }

    console.log(req.email)

    const enrichedObject: OrderRequest = {
        user_id: req.id,
        quantity: new Prisma.Decimal(orderObject.quantity),
        idempotency_key: Date.now().toString(),
        price: new Prisma.Decimal(orderObject.price),
        remaining_quantity: new Prisma.Decimal(orderObject.quantity),
        side: orderObject.side,
        type: orderObject.type,
        status: "PENDING",
    }

    try {
        /*---------------- Write the enriched object to DB ----------------*/
        const response = await createOrder(enrichedObject)

        if (!response) {
            res.status(402).json({
                message: "Unable to create an order, please try again",
                valid: false
            })
            return
        }

        /*---------------- Push the enriched object to queue ----------------*/
        await redisClient.lPush('orders', JSON.stringify({ id: response.id, ...enrichedObject, email: req.email }))


        /*---------------- Update the in-memory OrderBook ----------------*/

        res.status(200).json({
            message: 'Order created sucessfully',
            valid: true
        })

    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong",
            valid: false
        })
    }

}

export const getOrders = async (req: any, res: express.Response) => {
    try {
        const user_id = req.id
        const orders = await prisma.orders.findMany({
            where: {
                user_id: user_id
            },
            select: {
                id: true,
                side: true,
                status: true,
                price: true,
                quantity: true,
                remaining_quantity: true,
                created_at: true,
                updated_at: true
            }
        })
        if (!orders) {
            res.status(404).json({
                message: 'Orders not found, please place an order',
                valid: false
            })
            return
        }
        res.status(200).json({
            orders,
            valid: true
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong",
            valid: false
        })
    }
}

export const cancelOrder = async (req: express.Request, res: express.Response) => {
    try {
        const order_id = req.body.order_id;
        const cancelled = await prisma.orders.update({
            where: {
                id: order_id
            },
            data: {
                status: "CANCELLED"
            }
        })
        const book = await redisClient.get('orderBook')
        let orderBook = JSON.parse(book!)
        orderBook = orderBook.filter((order: any) => order.id !== order_id)
        await redisClient.set('orderBook', JSON.stringify(orderBook))
        if (!cancelled) {
            await redisClient.lPush('ORDER_UPDATE_RETRY', JSON.stringify({ id: order_id, data: { status: "CANCELLED" } }))
            res.status(403).json({
                message: "Unable to cancel order at the moment",
                valid: false
            })
            return
        }
        res.status(200).json({
            valid: true,
            message: 'Order cancelled'
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong",
            valid: false
        })
    }
}