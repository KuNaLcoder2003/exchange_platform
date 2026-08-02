import express from "express"
import { getBalance } from "../helpers/wallet.js"
import Stripe from "stripe"
import dotenv from "dotenv"
import { prisma } from "../db.js"
dotenv.config()

const WEBHOOK_SECRET = `${process.env.STRIPE_WEBHOOK_SECRET_KEY}`
const STRIPE_SECRET = `${process.env.STRIPE_SECRET_KEY}`
const stripe = new Stripe(STRIPE_SECRET)


export const getBalanceHandler = async (req: any, res: express.Response) => {
    try {
        const user_id = req.id
        const wallet = await getBalance(user_id)
        if (!wallet) {
            res.status(403).json({
                message: "Unable to fetch wallte details",
                valid: false
            })
            return
        }
        res.status(200).json({
            valid: true,
            wallet
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong"
        })
    }
}

export const addMoneyToWalletHandler = async (req: any, res: express.Response) => {
    try {
        // get the user's id
        const user_id = req.id
        // get the amount to add
        const { amount } = req.body
        if (!amount || amount == 0) {
            res.status(400).json({
                message: 'Please tell amount to add',
                valid: false
            })
            return
        }
        const new_transaction = await prisma.transactions.create({
            data: {
                type: "WALLET_TOPUP",
                user_id: user_id,
                amount: amount,
                status: "PENDING",
                stripe_id: ""
            }
        })
        if (!new_transaction) {
            res.status(403).json({
                message: "Unable to create transaction at the moment",
                valid: false
            })
            return
        }
        const response = await stripe.paymentIntents.create({
            amount: Number(amount) * 100,
            currency: 'usd',
            automatic_payment_methods: {
                enabled: false
            },
            payment_method_types: ["card", "link"],
            metadata: {
                user_id: user_id,
                transaction_id: new_transaction.id,
                type: 'WALLET_TOPUP'
            }
        })
        if (!response) {
            res.status(400).json({
                message: "Unable to create payment link",
                valid: false
            })
        }
        res.status(200).json({
            valid: true,
            client_secret: response.client_secret
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong",
            valid: false
        })
    }
}


export const withdrawMoneyHandler = async (req: express.Request, res: express.Response) => {
    try {

    } catch (error) {

    }
}