
import './App.css'
import { BrowserRouter, Routes, Route } from "react-router-dom";
import LandingPage from './pages/LandingPage'
// import LiveOrderBook from './components/LiveOrderBook';
import AuthPage from './pages/AuthPage';
import { AuthProvider } from './context/AuthContext';
import ProtectedRoute from './components/ProtectedRoute';
import Dashboard from './components/DashBoard';
import WalletPage from './components/Wallet';
import PaymetsPage from './pages/AddFundPage';
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


function App() {
  // const [socket, setSocket] = useState<WebSocket | null>(null)
  // const [orders, setOrders] = useState<Order[]>([])

  // useEffect(() => {
  //   const socket = new WebSocket('ws://localhost:8080')
  //   socket.onopen = () => {
  //     console.log('Connected to the Websockert server')
  //     setSocket(socket)
  //   }
  //   socket.onmessage = (message) => {
  //     console.log(JSON.parse(message.data))
  //     const data = JSON.parse(message.data) as Order[]
  //     console.log('DATA IS : ', data)
  //     if (data.length == 0) {
  //       setOrders([])
  //     } else {
  //       setOrders([...data])
  //     }
  //   }
  //   return () => {
  //     socket.close()
  //   }
  // }, [])

  // if (!socket) {
  //   return <div>Connecting......</div>
  // }
  // async function mockRequest() {
  //   const response = await fetch('http://localhost:3000/api/v1/auth/signup', {
  //     method: 'POST',
  //     credentials: "include",
  //     headers: {
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify({
  //       name: "Riday Singh",
  //       email: 'riday_singh2007@gmail.com',
  //       password: 'KSJpr#Raj@45',
  //       mobile: '+91-8302696998',
  //       gender: 'Male',
  //       dob: '2007-11-10',
  //     })
  //   })
  //   const data = await response.json()
  //   console.log(data)
  // }

  return (

    <>

      <BrowserRouter>

        <AuthProvider>
          <Routes>

            <Route path="/" element={<LandingPage />} />


            {/* <Route path='/order' element={<LiveOrderBook wsUrl="ws://localhost:8080" pair="SOL/USDC" />} /> */}
            <Route path='/auth' element={<AuthPage />} />




            <Route element={<ProtectedRoute />}>
              <Route path='/addMoney' element={<PaymetsPage />} />
              <Route
                path="/home"
                element={<Dashboard />}
              />
              <Route
                path="/wallet"
                element={<WalletPage />}
              />
            </Route >

            {/* <Route
                path="/admin"
                element={<}
              /> */}
          </Routes>
        </AuthProvider>
      </BrowserRouter>
      {/* <div style={{ display: "flex", gap: "20px", marginTop: "20px" }}>

      
        <div
          style={{
            flex: 1,
            backgroundColor: "#ffe6e6",
            border: "1px solid #ff4d4d",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h2 style={{ color: "red", textAlign: "center" }}>SELL ORDERS</h2>

          {orders
            .filter((order) => order.side === "SELL")
            .map((order) => (
              <div
                key={order.id}
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #ff9999",
                  borderRadius: "6px",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              >

                <p><strong>Price:</strong> ₹{order.price}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>

              </div>
            ))}
        </div>

     
        <div
          style={{
            flex: 1,
            backgroundColor: "#e6ffe6",
            border: "1px solid #28a745",
            borderRadius: "8px",
            padding: "15px",
          }}
        >
          <h2 style={{ color: "green", textAlign: "center" }}>BUY ORDERS</h2>

          {orders
            .filter((order) => order.side === "BUY")
            .map((order) => (
              <div
                key={order.id}
                style={{
                  backgroundColor: "#fff",
                  border: "1px solid #66cc66",
                  borderRadius: "6px",
                  padding: "10px",
                  marginBottom: "10px",
                }}
              >

                <p><strong>Price:</strong> ₹{order.price}</p>
                <p><strong>Quantity:</strong> {order.quantity}</p>

              </div>
            ))}
        </div>

      </div> */}

    </>



  )
}

export default App
