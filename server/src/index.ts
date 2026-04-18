import express from 'express'
import cors from 'cors'
import { initDatabase } from './models/database.js'
import dramaRoutes from './routes/drama.js'
import authRoutes from './routes/auth.js'
import userRoutes from './routes/user.js'
import walletRoutes from './routes/wallet.js'
import orderRoutes from './routes/order.js'
import adminRoutes from './routes/admin.js'
import adminDramaRoutes from './routes/adminDrama.js'
import adminOrderRoutes from './routes/adminOrder.js'
import adminUserRoutes from './routes/adminUser.js'
import adminSigninRoutes from './routes/adminSignin.js'

const app = express()
const PORT = process.env.PORT || 3001

// Middleware
app.use(cors())
app.use(express.json())

// Initialize database
initDatabase()

// Routes
app.use('/api/dramas', dramaRoutes)
app.use('/api/auth', authRoutes)
app.use('/api/user', userRoutes)
app.use('/api/wallet', walletRoutes)
app.use('/api/orders', orderRoutes)

// Admin routes
app.use('/api/admin/auth', adminRoutes)
app.use('/api/admin/drama', adminDramaRoutes)
app.use('/api/admin/order', adminOrderRoutes)
app.use('/api/admin/user', adminUserRoutes)
app.use('/api/admin/signin', adminSigninRoutes)

// Health check
app.get('/api/health', (req, res) => {
  res.json({ code: 0, message: 'ok', data: { status: 'healthy' } })
})

app.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`)
})
