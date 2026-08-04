import express from "express"
import { authMiddleWare } from "../middlewares/authMiddleware.js"
import { getTrades } from "../controllers/trades.controller.js"

const tradeRouter = express.Router()


tradeRouter.post('/getTrades', authMiddleWare, getTrades)
export default tradeRouter