import express, { json } from "express"
import { createUser, findUser, generateToken, getUserAuth } from "../helpers/users.js"
import { prisma } from "../db.js"


export const signUp = async (req: express.Request, res: express.Response) => {
    try {
        const { email, mobile, name, password, dob, gender } = req.body
        // first check is if the user exists 
        const exists = await findUser(email, "")
        if (exists) {
            res.status(402).json({
                message: "User already exists",
                valid: false
            })
            return
        }

        let userDetails = {
            email,
            password,
            mobile,
            dob,
            gender,
            name,
        }

        // create new user
        const user = await createUser(userDetails)
        if (!user) {
            res.status(403).json({
                message: "Unable to create user",
                valid: false
            })
            return
        }
        const token = generateToken(user.email, user.id)
        res.cookie('token', `Bearer ${token}`, {
            httpOnly: true,
            sameSite: "lax",
        })
        res.status(200).json({
            message: 'Account created!!!',
            valid: true
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong',
            valid: false
        })
    }
}

export const signin = async (req: express.Request, res: express.Response) => {
    try {
        const { email, password } = req.body
        if (!email || !password) {
            res.status(400).json({
                message: "Please provide credentials"
            })
            return
        }
        const { valid, user, message } = await getUserAuth(email, password)

        if (!valid || !user) {
            res.status(401).json({
                message,
                user,
                valid: false
            })
            return
        }
        const token = generateToken(user.email, user.id)
        res.cookie('token', `Bearer ${token}`, {
            sameSite: "lax",
            httpOnly: true
        })
        res.status(200).json({
            message,
            valid: true
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: 'Something went wrong',
            valid: false
        })
    }
}

export const getMe = async (req: any, res: express.Response) => {

    const id = req.id
    try {
        const user = await prisma.user.findUnique({
            where: {
                id: id
            },
            select: {
                email: true,
                name: true,
                dob: true,
                gender: true,
                id: true
            }
        })
        if (!user) {
            res.status(401).json({
                message: "Unauthorized access , user does not exists",
                valid: false
            })
            return
        }
        res.status(200).json({
            user: user,
            valid: true
        })
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "Something went wrong",
            valid: false
        })
    }

}

export const logout = (req: express.Request, res: express.Response) => {
    try {

        res.clearCookie('token', {
            httpOnly: true,
            secure: true,
            sameSite: 'lax'
        });
        res.redirect('http://localhost:5173/auth')
    } catch (error) {
        console.log(error)
        res.status(500).json({
            message: "something went wrong",
            valid: false
        })
    }
}