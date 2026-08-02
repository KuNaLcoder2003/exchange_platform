import express from "express"

import { newOrder } from "../controllers/orders.controller.js"

const orderRouter = express.Router()

orderRouter.post('/newOrder', newOrder)

export default orderRouter