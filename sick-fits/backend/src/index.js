require('dotenv').config({ path: 'variables.env' })
const createServer = require('./createServer')
const db = require('./db')

const server = createServer()

// TODO use express to handle cookies (JWT)
// TODO use express to populate current users


server.start({
    cors: {
        credentials: true,
        origin: process.env.FRONTEND_URL
    }
}, deets => console.log(`server is running on port http:/localhost${deets.port}`))