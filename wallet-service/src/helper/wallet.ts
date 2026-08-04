import { prisma, Decimal } from "../../../primary-backend/dist/db.js"

export const updateWallet = async (user_id: string, amount: Number, side: "BUY" | "SELL") => {
    return prisma.wallet.update({
        where: {
            user_id: user_id
        },
        data: {
            usdt_balance: {
                increment: new Decimal(Number(amount))
            }
        }
    })
}