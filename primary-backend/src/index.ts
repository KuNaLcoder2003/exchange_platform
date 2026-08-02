import express from "express"
import cookieParser from "cookie-parser";
import cors from "cors"
import { createClient } from "redis"
import dotenv from "dotenv"
import authRouter from "./routes/auth.route.js";
import walletRouter from "./routes/wallet.route.js";
import orderRouter from "./routes/order.route.js";
import Stripe from 'stripe'
import { Transaction_Status } from "@prisma/client"
import { prisma } from './db.js'
import { Decimal } from "@prisma/client/runtime/client";
import { WalletTopUpPdf } from "./helpers/pdf.js";


dotenv.config()
const app = express()
app.use(cors({
    origin: "http://localhost:5173",
    credentials: true
}))

const WEBHOOK_SECRET = `${process.env.STRIPE_WEBHOOK_SECRET_KEY}`
const STRIPE_SECRET = `${process.env.STRIPE_SECRET_KEY}`
const stripe = new Stripe(STRIPE_SECRET)


app.post('/webhook-handler', express.raw({ type: 'application/json' }), async (req: express.Request, res: express.Response) => {
    let event: Stripe.Event
    try {
        const signature = req.headers['stripe-signature'] as string
        event = stripe.webhooks.constructEvent(
            req.body,
            signature,
            WEBHOOK_SECRET
        )
    } catch (error) {
        console.log(`Webhook signature verification failed.`, error);
        return res.sendStatus(400);
    }

    switch (event.type) {
        case "payment_intent.succeeded":
            const response_object = event.data.object
            const user_id = response_object.metadata.user_id!
            const transaction_id = response_object.metadata.transaction_id!
            const transaction_status = await prisma.transactions.findUnique({
                where: {
                    id: transaction_id
                },
            })
            if (!transaction_status) {
                // refund money
                await stripe.refunds.create({
                    payment_intent: response_object.id,
                    amount: response_object.amount,
                    currency: response_object.currency,
                    metadata: {
                        stripe_id: response_object.id,
                        user_id: user_id,
                        type: "REFUND"
                    }
                })
                return res.status(200).json({
                    message: "Refund processed"
                })
            }
            else if (transaction_status.status == "COMPLETED") {
                // do nothing
                return
            } else if (transaction_status.status == "PENDING") {
                console.log('HEREEEEEEEE UPATING BOTH WALLET AND TRANSACTION ENTRIES')
                // update the transaction row with id = transaction_id 
                console.log(event.data.object.metadata)
                const result = await prisma.$transaction(async (tx) => {
                    const updated_wallet = await tx.wallet.update({
                        where: {
                            user_id: user_id
                        },
                        data: {
                            inr_balance: {
                                increment: new Decimal(Number(response_object.amount))
                            }
                        }
                    })

                    const details = await tx.transactions.update({
                        where: {
                            id: transaction_id,
                        },
                        data: {
                            status: "COMPLETED",
                            stripe_id: response_object.id
                        }, select: {
                            id: true,
                            amount: true,
                            status: true,
                            stripe_id: true,
                            user_id: true,
                            user: {
                                select: {
                                    email: true,
                                    name: true,
                                }
                            }
                        }
                    })
                    return { updated_wallet, details }
                }, { maxWait: 5000, timeout: 10000 })

                const pdfBuffer = await WalletTopUpPdf(result.details.user_id, result.details.user.name, Number(result.updated_wallet.inr_balance), result.details.amount, result.details.stripe_id)!
                const attachments = {
                    fileName: "reciept.pdf",
                    contentType: 'application/pdf',
                    content: pdfBuffer
                }
                await redisClient.lPush('MAIL_SERVICE', JSON.stringify({
                    event: "TRANSACTION_WALLET_TOPUP", data: {
                        user_id: result.details.user_id,
                        user_name: result.details.user.name,
                        email: result.details.user.email,
                        amount: result.details.amount,
                        merchant_id: result.details.id,
                        wallet_balance: result.updated_wallet.inr_balance,
                        attachments: [attachments]
                    }
                }))
            } else {
                return
            }
            res.status(200).json({ received: true });
            break;
        case "payment_intent.payment_failed":
            console.log('Failure')
            console.log('\n')
            console.log('\n')
            console.log(event.data)
            res.status(200).json({ received: true });
            break;
        case "refund.created":

            break;
    }

})

app.get('/invoice', async (req: express.Request, res: express.Response) => {
    const invoices = await stripe.invoices.list({
        limit: 10
    })
    res.status(200).json({
        invoices
    })
})


app.use(cookieParser());

app.use(express.json())
app.use('/api/v1/auth', authRouter)
app.use('/api/v1/wallet', walletRouter)
app.use('/api/v1/order', orderRouter)
export const redisClient = createClient()
async function startServer() {
    try {
        await redisClient.connect()
        console.log('Connected to Redis')
        app.listen(3000, () => {
            console.log('App started')
        })
    } catch (error) {
        console.log(error)
    }
}
startServer()