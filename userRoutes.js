const express = require("express");
const userROuter = express.Router();

userRouter.post("/signup",(req,res)=>{
  res.send("Signup");
})

userROuter.post("/signin",(req,res)=>{
  res.send("SignIn");
})

