import express from "express"
import { getMe, logout, signin, signUp } from "../controllers/auth.controller.js"
import { authMiddleWare } from "../middlewares/authMiddleware.js"

const authRouter = express.Router()

authRouter.post('/signup', signUp)
authRouter.post('/signin', signin)
authRouter.get('/me', authMiddleWare, getMe)
authRouter.post('/logout', logout)
export default authRouter