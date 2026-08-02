import { prisma } from '../db.js';
import jwt from 'jsonwebtoken'
import dotenv from 'dotenv'
import bcrypt from 'bcrypt'
import { Decimal } from '@prisma/client/runtime/client';
const SALTS = 10
const JWT_SECRET = process.env.JWT_SECRET as string
dotenv.config()
type User = {
    email: string
    password: string
    mobile: string
    dob: string
    gender: string
    name: string
}
export async function findUser(email: string, id: string) {
    const user = await prisma.user.findFirst({
        where: {
            OR: [{ id: id }, { email: email }]
        }
    })

    return user
}

export async function getUserAuth(email: string, password: string) {
    const user = await prisma.user.findFirst({
        where: {
            email: email
        }
    })

    if (!user) {
        return {
            valid: false,
            message: "User does not exists , please create an account",
            user: null
        }
    }

    const matched = await bcrypt.compare(password, user.password)

    if (!matched) {
        return {
            valid: false,
            message: "Incorrect password , please enter correct password",
            user: null
        }
    }
    return {
        valid: true,
        message: "Logged in successfully",
        user: user
    }

}

export async function createUser(userDetails: User) {
    const hashed_password = await bcrypt.hash(userDetails.password, 10)
    let user_object: User = {
        ...userDetails,
        password: hashed_password
    }
    const result = await prisma.$transaction(async (tx) => {
        const new_user = await tx.user.create({
            data: {
                ...user_object
            }
        })
        const user_wallet = await tx.wallet.create({
            data: {
                user_id: new_user.id,
                inr_balance: new Decimal(0),
                inr_locked: new Decimal(0),
                usdt_balance: new Decimal(0),
                usdt_locked: new Decimal(0)
            }
        })
        return { new_user, user_wallet }
    }, { timeout: 10000, maxWait: 5000 })

    if (!result.new_user || !result.user_wallet) {
        return false
    }
    else {
        return result.new_user
    }
}

export const generateToken = (email: string, id: string) => {
    const token = jwt.sign({ email, id }, JWT_SECRET)
    return token
}
