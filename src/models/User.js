const { Schema, model } = require('mongoose')

const messageSchema = new Schema({
  from : { type:String, required:true },
  to:{ type:String, required:true },
  message:{ type:String, required:true }
},{
  timestamps:true
})

const friendSchema = new Schema({
  username : { type:String, required:true },
  chatId:{ type:String, required:true },
  requestAccepted:{ type:Boolean, default:false, required:true },
  whoRequested:{ type:String, required:true },
  whoAccepted:{ type:String, required:true },
  messages:[messageSchema]
})

const userSchema = new Schema({
  username : { type:String, required:true, unique:true },
  email : { type:String, required:true },
  password : { type:String, required:true },
  chatId : { type:String, required:true },
  friends:[friendSchema]
})

const User = model('user',userSchema)
module.exports = User