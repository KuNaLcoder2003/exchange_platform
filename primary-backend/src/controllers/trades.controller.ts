import express from "express"
import { prisma } from "../db.js"

export const getTrades = async (req: express.Request, res: express.Response) => {
    try {
        const orderId = req.body.orderId
        if (!orderId) {
            res.status(400).json({
                message: "Please select an order to view trades",
                valid: false
            })
            return
        }

        const trade = await prisma.trade.findMany({
            where: {
                OR: [{ buy_order_id: orderId }, { sell_order_id: orderId }]
            }
        })
        if (!trade) {
            res.status(404).json({
                message: "No trades found for the order",
                valid: false
            })
            return
        }
        res.status(200).json({
            valid: true,
            trades: trade
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong",
            valid: false
        })
    }
}