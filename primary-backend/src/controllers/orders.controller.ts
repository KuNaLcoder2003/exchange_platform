import express, { response } from "express"
import { createOrder, type OrderRequest } from "../helpers/order.js"
import { redisClient } from "../index.js"
import type { Decimal } from "@prisma/client/runtime/client"
import { Prisma } from "@prisma/client"

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

    const enrichedObject: OrderRequest = {
        user_id: orderObject.id,
        quantity: new Prisma.Decimal(orderObject.quantity),
        idempotency_key: orderObject.idempotency_key,
        price: new Prisma.Decimal(orderObject.price),
        remaining_quantity: new Prisma.Decimal(orderObject.quantity),
        side: orderObject.side,
        type: orderObject.type,
        status: "PENDING",
        email: orderObject.email
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
        await redisClient.lPush('orders', JSON.stringify({ id: response.id, ...enrichedObject }))


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