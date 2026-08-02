import express from "express"
import { WebSocket, WebSocketServer, type RawData } from 'ws'
import jwt from "jsonwebtoken"
import { createClient } from "redis"

type OrderStatus =
    "PENDING" |
    "PARTIALLY_FILLED" |
    "FILLED" |
    "CANCELLED" |
    "REJECTED"


export type Order = {
    id: string
    idempotency_key: string
    status: OrderStatus
    quantity: string
    remaining_quantity: string
    price: string
    side: 'SELL' | 'BUY'
    type: 'LIMIT_ORDER' | 'MARKET_ORDER'
    created_at: Date,
    updated_at: Date
    user_id: string
}
const app = express()
const httpServer = app.listen(8080)
const redisClient = createClient()

const wss = new WebSocketServer({ server: httpServer })

const clients = new Map<string, WebSocket>()

wss.on('connection', async (ws, req) => {
    ws.on('error', (err) => console.error(err))
    ws.on('message', (message: RawData) => {
        const data = JSON.parse(message.toString())
        if (data.type == "Authenticate") {
            const token = data.token
            const verified = jwt.verify(token, 'i3r80j23riunjer983jrijef') as { email: string, id: string }
            if (verified) {
                clients.set(verified.id, ws)
            } else {
                ws.send('Not verified')
            }
        }
    })
    const data = await redisClient.get('orderBook')
    if (data) {
        const orderBook = JSON.parse(data) as Order[]
        ws.send(JSON.stringify(orderBook))
    }
    else {
        ws.send(JSON.stringify([]))
    }
})

async function sendNotifications() {
    await redisClient.connect()
    console.log('Connected to redis')
    await redisClient.subscribe('OrderBookUpdated', (message) => {
        console.log('message data is :', JSON.parse(message))
        const data = JSON.parse(message) as Order[]
        // commented for testing purposes
        // clients.forEach(client => {
        //     client.send(JSON.stringify(data))
        // })
        wss.clients.forEach(client => {
            if (client.readyState == WebSocket.OPEN) {
                client.send(JSON.stringify(data))
            }
        })
    })
}

sendNotifications()