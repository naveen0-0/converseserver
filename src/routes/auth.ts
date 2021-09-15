import { Router, Request, Response } from 'express'
const router = Router()
const User = require('../models/User.js')
import jwt from 'jsonwebtoken'
import { checkToken } from '../utils/utils'
import { ACCESS_TOKEN } from '../keys'
// import bcryptjs from 'bcryptjs'


//* Signup route
router.route('/signup').post( async (req:Request,res:Response)=>{
  const { username, email, password, chatId } = req.body;
  try {
    //* Checking Username exists or not
    const usernameExists = await User.findOne({ username : username })
    if(usernameExists) return res.send({ statusload : false, msg : "UserName Taken"})
    
    //* Checking email exists or not
    const emailExists = await User.findOne({ email : email })
    if(emailExists) return res.send({ statusload : false, msg : "Email Taken"})

    //* Creating a user
    await User.create({ username, email, password, chatId })
    return res.send({ statusload : true, msg:"Account Created"})

  } catch (error) {
    return res.send({ statusload : false, msg : "Error Creating Account" })
  }
})


//* Login Route
router.route('/login').post(async (req:Request,res:Response) => {
  const { username, password } = req.body;
  try {
    let user = await User.findOne({ username })
    if(user){
      if(user.password === password){
        //* Create a token and send it to front end
        jwt.sign({ username,email:user.email },ACCESS_TOKEN,(err:any,token:any) => {
          if(err){
            return res.send({ statusload : false, msg : "Password Incorrect" })
          }
          return res.send({ statusload : true, user:{username, email: user.email ,loggedIn:true, chatId : user.chatId},token:token})
        })
      }else{
        return res.send({ statusload : false, msg : "Password Incorrect" })
      }
    }else{
      return res.send({ statusload : false, msg : "Username Incorrect" })
    }
  } catch (error) {
    return res.send({ statusload : false, msg : "Error logging in"})
  } 
})

//* Get User
router.route('/getuser').get(checkToken,async (req:any,res:any) => {
  try {
    let { username, email, chatId} = await User.findOne({ username : req.user.username })
    res.send({ statusload : true, user : { username, email, chatId, loggedIn: true } })
  } catch (error) {
    res.send({ statusload : false })
  }
})


router.route('/signout').post((req,res) => {
  const authtoken = req.headers.authorization;
  if(authtoken){
    res.send({ statusload : true, user: { username : "", email : "", loggedIn : false , chatId : ""}})
  }else{
    return res.send({ statusload : false, msg : "You have to be logged in to logout"})
  }
})

export default router;