import express from "express"
import { authMiddleWare } from "../middlewares/authMiddleware.js"
import { addMoneyToWalletHandler, getBalanceHandler, withdrawMoneyHandler } from "../controllers/wallet.controller.js"

const walletRouter = express.Router()


walletRouter.get('/getBalance', authMiddleWare, getBalanceHandler)
walletRouter.post('/add', authMiddleWare, addMoneyToWalletHandler)
walletRouter.post('/withdraw', authMiddleWare, withdrawMoneyHandler)

export default walletRouter