import express from "express"
import jwt from "jsonwebtoken"
import dotenv from 'dotenv'
dotenv.config()
const JWT_SECRET = process.env.JWT_SECRET as string

export function authMiddleWare(req: any, res: express.Response, next: express.NextFunction) {
    const authToken = req.cookies.token
    console.log(authToken)
    if (!authToken || !authToken.startsWith('Bearer ')) {
        res.status(401).json({
            message: "Unauthorized access",
            valid: false
        })
        return
    }

    const token = authToken.split('Bearer ').at(-1) as string

    const verified = jwt.verify(token, JWT_SECRET) as { email: string, id: string }

    if (!verified) {
        res.status(401).json({
            message: "Unauthorized access",
            valid: false
        })
        return
    }

    else {
        req.id = verified.id
        req.email = verified.email
        next()
    }
}