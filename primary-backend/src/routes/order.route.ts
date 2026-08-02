import express from "express"

import { newOrder } from "../controllers/orders.controller.js"
import { authMiddleWare } from "../middlewares/authMiddleware.js"

const orderRouter = express.Router()

orderRouter.post('/newOrder', authMiddleWare, newOrder)

export default orderRouter