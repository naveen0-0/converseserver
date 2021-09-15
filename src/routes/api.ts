import { Router } from 'express'
const router = Router()
import { checkToken } from '../utils/utils'
const User = require('../models/User.js')

router.route('/friend/username').post(checkToken,async (req:any,res) => {
  const { username } = req.body

  let user = await User.findOne({ username : username })

  if(user){
    if(user.username === req.user.username) return res.send({ statusload: false,msg:"You searched yourself"})

    
    try {
      let friend = await User.findOne({ username:req.user.username,friends: { $elemMatch : { username }}})
      let whoAccepted = await User.findOne({ username: req.user.username , friends : { $elemMatch : { whoAccepted: username}}})

      if(friend){
        let requestAccepted = await User.findOne({ username:req.user.username,friends: { $elemMatch : { username, requestAccepted:true }}})
        if(requestAccepted) return res.send({ statusload: true, statusnum:1,text:"Already Friended",user : { username: user.username }})
        if(whoAccepted) return res.send({ statusload: true, text:"Request Sent",statusnum:2,user : { username: user.username }})
        return res.send({ statusload: true, text:"Request Pending",statusnum:3,user : { username: user.username }})
      }
      return res.send({ statusload: true, statusnum:4,user : { username: user.username, chatId : user.chatId}})
    } catch (error) {
      res.send({ statusload: false})
    }
  }

  res.send({ statusload:false, msg:"No one with that username"})
})



router.route('/friends').get(checkToken, async (req:any,res:any) => {
  try {
    let user = await User.findOne({ username : req.user.username })
    return res.send({ statusload : true, friends :user.friends })
  } catch (error) {
    return res.send({ statusload : false})
  }
})

export default router;