import { useEffect, useState } from "react";
import toast from "react-hot-toast";


const BACKEND_URL = import.meta.env.VITE_BACKEND_URL
export function useWallet() {
    const [loadingBalance, setLoadingBalance] = useState<boolean>(false)
    const [inr_balance, setInr_Balance] = useState<Number | null>(0)
    const [usdt_balance, setUsdt_Balance] = useState<Number | null>(0)

    useEffect(() => {
        try {
            setLoadingBalance(true)
            fetch(`${BACKEND_URL}/api/v1/wallet/balance`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json'
                }
            }).then(async (response: Response) => {
                const data = await response.json()
                if (data.valid) {
                    setInr_Balance(data.inr_balance)
                    setUsdt_Balance(data.usdt_balance)
                    setLoadingBalance(false)
                } else {
                    setInr_Balance(null)
                    setUsdt_Balance(null)
                    toast.error(data.message)
                    setLoadingBalance(false)
                }
            })
        } catch (error) {
            console.log(error)
            toast.error('Something went wrong')
            setLoadingBalance(false)
        }
    }, [])

    return { inr_balance, usdt_balance, loadingBalance }
}