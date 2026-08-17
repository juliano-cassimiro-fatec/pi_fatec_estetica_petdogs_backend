import 'dotenv/config'
import app from './app/app.js'
import database from './config/database.js'

const PORT = process.env.PORT || 3000

async function startServer(): Promise<void> {
    await database.connect()

    app.listen(PORT, () => {
        console.log(`Server is running on port ${PORT}`)
    })
}

startServer()
