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
    console.log(data);
    
    
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

    if(updateOneDone){
      socket.emit('friend_request_success',{friend:{ username :data.username, chatId:data.chatId,whoRequested:data.whoRequested, whoAccepted:data.username, messages:[],requestAccepted:false }})
    }
      
    if(updateTwoDone){
      io.to(data.chatId).emit('friend_request',{friend : { username :data.whoRequested, chatId:data.requestingguychatId,whoRequested:data.whoRequested, whoAccepted:data.username, messages:[],requestAccepted:false }})
    }
  })

  //! Working on This
  socket.on('accept_friend_request', async data => {
    let updateOneDone =  await User.findOneAndUpdate({chatId:data.chatId,"friends.chatId":data.friendChatId},{ $set : { "friends.$.requestAccepted":true}})
    let updateTwoDone = await User.findOneAndUpdate({chatId:data.friendChatId,"friends.chatId":data.chatId},{ $set : { "friends.$.requestAccepted":true}})
    
      
    if(updateOneDone){
      socket.emit('accept_friend_request_success',data)
    }
    if(updateTwoDone){
      io.to(data.friendChatId).emit('accept_friend_request',data)
    }
  })
    
  
  socket.on('decline_friend_request', data => {
    console.log(data);
    //* delete the friend 
    //* in both users and in the redux store
  })

  //* Sending Messages
  socket.on('send_message', async data => {
    console.log(data);
    const date = Date.now
    let user = await User.findOne({ username:data.username,"friends.username": data.friendUsername })
    console.log(user)
    //*Client 1
    socket.emit('send_message_success',{...data,createdAt:date})
    //*Client 1
    io.to(data.friendChatId).emit('send_message',{...data,createdAt:date })
  })


  socket.on('disconnect',() => console.log("User left"))
})