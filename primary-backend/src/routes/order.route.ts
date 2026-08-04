import express from "express"

import { cancelOrder, getOrders, newOrder } from "../controllers/orders.controller.js"
import { authMiddleWare } from "../middlewares/authMiddleware.js"

const orderRouter = express.Router()

orderRouter.post('/newOrder', authMiddleWare, newOrder)
orderRouter.get('/getOrders', authMiddleWare, getOrders)
orderRouter.post('/cancel', authMiddleWare, cancelOrder)

export default orderRouter