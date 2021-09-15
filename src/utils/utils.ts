import jwt from 'jsonwebtoken'
import { Response, NextFunction } from 'express'
import { ACCESS_TOKEN } from '../keys'

export const checkToken = (req:any,res:Response,next:NextFunction) => {
    const conversetoken = req.headers.authorization
    if(conversetoken!==null){
        jwt.verify(conversetoken,ACCESS_TOKEN,(err:any,decoded:any) => {
            req.user = decoded;
            next();
        })
    }else{
        return res.send({
            msg:"You have to be logged in to perform this action"
        })
    }
}
