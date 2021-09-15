import express from 'express'
import cors from 'cors'
import { createServer } from 'http'
import { Server, Socket } from 'socket.io'
import dotenv from 'dotenv'
import morgan from 'morgan'
import helmet from 'helmet'
import mongoose from 'mongoose'
import authRoutes from './routes/auth'
import apiRoutes from './routes/api'
const User = require('./models/User.js')

const app = express()
const server = createServer(app)
const io = new Server(server,{
  cors: {
     origin: "http://localhost:3000",
     methods: ["GET", "POST"]
  }
})

//*Middleware
app.use(express.json())
app.use(express.urlencoded({ extended:true }))
dotenv.config()
app.use(morgan('tiny'))
app.use(helmet())
app.use(cors())
app.use('/auth',authRoutes)
app.use('/api',apiRoutes)


//* Mongodb connection
const MONGO = process.env.MONGO || "mongodb://localhost/converse";
mongoose.connect(MONGO)
        .then(() => console.log("Mongo connection successful"))
        .catch(() =>  console.log("Mongo connection failure"))
   
//* PORT
const PORT = process.env.PORT || 5000
server.listen(PORT,() => console.log(`Server running on port ${PORT}`))

//* IO Stuff
io.on('connection',(socket:Socket) => {
  const chatId:any = socket.handshake.query.chatId
  console.log("User Connected",chatId)
  socket.join(chatId)

  socket.on('friend_request',async (data) => {
    
    // Insert in client1
    let updateOneDone = await User.updateOne({ username:data.whoRequested },{
      "$push":{
        "friends":{"username":data.username,"chatId":data.chatId,"whoRequested":data.whoRequested,"whoAccepted":data.username,"messages":[]}
      }
    })
    
    // Insert in client2
    let updateTwoDone = await User.updateOne({ username:data.username },{
      "$push":{
        "friends":{"username":data.whoRequested,"chatId":data.requestingguychatId,"whoRequested":data.whoRequested,"whoAccepted":data.username,"messages":[]}
      }
    })

    if(updateOneDone && updateTwoDone){
      //* Send the added friend to front end received user
      io.to(data.chatId).emit('friend_request',{ requestedfriend : { username :data.whoRequested, chatId:data.requestingguychatId,whoRequested:data.whoRequested, whoAccepted:data.username, messages:[] },
      acceptedfriend:{ username :data.username, chatId:data.chatId,whoRequested:data.whoRequested, whoAccepted:data.username, messages:[] }})
    }
  })

  socket.on('friend_request_success',data => {    
    io.to(data.chatId).emit('friend_request_success',data.acceptedfriend)
  })

  socket.on('disconnect',() => console.log("User left"))
})