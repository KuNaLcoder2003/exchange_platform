import { prisma } from '../db.js';

export const getBalance = async (user_id: string) => {
    try {
        const user_wallet = await prisma.$transaction(async (tx) => {
            const wallet = await tx.wallet.findUnique({
                where: {
                    user_id: user_id
                }
            })

            return wallet
        }, { timeout: 10000, maxWait: 5000 })

        if (!user_wallet) {
            return false
        } else {
            return user_wallet
        }
    } catch (error) {
        console.log(error)
        return false
    }
}