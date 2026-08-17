import 'dotenv/config'
import app from './app/app.js'
import { connectDatabase } from './config/database.js'

const PORT = process.env.PORT || 3000

async function startServer(): Promise<void> {
    await connectDatabase()

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

startServer().catch((error: unknown) => {
    console.error("Error starting server:", error)
    process.exit(1)
})
