import React, { createContext, useContext, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
type User = {
    id: string;
    email: string;
    gender: string;
    dob: string;
    name: string;
}

const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
const AuthContext = createContext<{ user: User, loading: boolean, isLoggedIn: boolean, signin: (email: string, password: string) => Promise<void>, signup: (name: string, email: string, password: string, mobileNumber: string, gender: "MALE" | "FEMALE", dob: string) => Promise<void>, logout: () => Promise<void> } | null>(null)

export function AuthProvider({ children }: { children: React.ReactNode }) {
    const navigate = useNavigate()
    const [user, setUser] = useState<User | null>(null);
    const [loading, setLoading] = useState(true);
    const [isLoggedIn, setIsLggedIn] = useState<boolean>(false)

    useEffect(() => {
        setLoading(true)
        fetch(`${BACKEND_URL}/api/v1/auth/me`, {
            credentials: "include",
            method: 'GET'
        }).then(async (res: Response) => {
            const data = await res.json()
            if (data.valid) {
                navigate('/home')
                setUser(data.user)
                setIsLggedIn(true)
            } else {
                setUser(null)
                setIsLggedIn(false)
                navigate('/auth')
            }
        })
        setLoading(false)
    }, []);

    async function signin(email: string, password: string) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/auth/signin`, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    email: email,
                    password: password
                })
            })
            const data = await response.json()
            if (!data.valid) {
                toast.error(data.message)
                setIsLggedIn(false)
                navigate('/auth')
                setUser(null)
            } else {
                if (!loading) {
                    toast.success(data.message)
                    setIsLggedIn(true)
                    setUser(data.user)
                    navigate('/home')
                }
            }
        } catch (error) {
            console.log(error)
            toast.error('Something went wrong')
            setIsLggedIn(false)
            setUser(null)
            navigate('/auth')
        }
    }
    async function signup(name: string, email: string, password: string, mobileNumber: string, gender: "MALE" | "FEMALE", dob: string) {
        try {
            const response = await fetch(`${BACKEND_URL}/api/v1/auth/signup`, {
                method: 'POST',
                credentials: "include",
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: name,
                    email: email,
                    password: password,
                    mobile: mobileNumber,
                    gender: gender,
                    dob: dob,
                })
            })
            const data = await response.json()
            if (!data.valid) {
                toast.error(data.message)
                setIsLggedIn(false)
                setUser(null)
                navigate('/auth')

            } else {
                toast.success(data.message)
                setIsLggedIn(true)
                setUser(data.user)
                navigate('/home')
            }
        } catch (error) {
            console.log(error)
            toast.error('Something went wrong')
            setIsLggedIn(false)
            setUser(null)
            navigate('/auth')
        }
    }

    async function logout() {
        const response = await fetch(`${BACKEND_URL}/api/v1/auth/logout`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            credentials: "include"
        })
        const data = await response.json()
        console.log(data)
        setUser(null)
        setIsLggedIn(false)
    }
    return (
        <AuthContext.Provider value={{ user, isLoggedIn, loading, signin, signup, logout }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext);