const User= require("../models/User");
const mailSender= require("../utils/mailSender");
const crypto = require("crypto");
const bcrypt = require("bcryptjs");



//reset pass token
exports.resetPasswordToken = async(req,res) => {
    try{
        //get email from req ki body
    const {email}= req.body;
    //check user for this email , email validation
    const user= await User.findOne({email:email});
    if(!user)
    {
        return res.json({
            success:false,
            message:"Your email is not registred with us"
        })
    }
    //generate token
    const token=crypto.randomUUID();
    //update user by adding token and expiration time
    const updatedUser=await User.findOneAndUpdate(
        {email:email},
        {
            token:token,
            resetPasswordExpires:Date.now() + 5*60*1000,
        },
        {new:true}
    )

    console.log("User after token update:", updatedUser);
    //create url
    const url=`http://localhost:3000/update-password/${token}`
    //sned mail contianing the url
    await mailSender(email,"Password Reset Link",`Password Reset Link: ${url}`)
    //return repsonse
    return res.json({
        success:true,
        message:"email sent successfully,please check email and reset password"
    })
    }
    catch(error)
    {
        console.log(error)
        return res.status(500).json({
        success:false,
        message:"something went wrong while sending resetting pwd mail"
    })
    }
  
}

//reset password
exports.resetPassword = async(req,res) => {
    try{
        //data fetch
        const{password,confirmPassword,token}= req.body;
        console.log("Token received:", token);

        //validatuion
        if(password !== confirmPassword)
        {
            return res.json({
            success:false,
            message:"password not matching"
        })
        }
        //get user details from db using token
        const userDetails= await User.findOne({token:token})
        console.log("User found with token:", userDetails);
       
        //if no entry- invalid token
         if(!userDetails)
        {
            return res.json({
                success:false,
                message:'token is invalid'
            })
        }
        //token time check
        if(userDetails.resetPasswordExpires < Date.now())
        {
            return res.json({
                success:false,
                message:'token is expired, please regenrate your token'
            })
        }
        //hash pwd
        const hashedPassword= await bcrypt.hash(password,10)
        //pwd update
        await User.findOneAndUpdate(
            {token:token},
            {password:hashedPassword},
            {new:true}
        )
        //return res
         return res.status(200).json({
                success:true,
                message:'password reset successfull'
            })
    }
    catch(error)
    {
       
        console.log(error)
        return res.status(500).json({
        success:false,
        message:"something went wrong while resetting pwd"
    })
    }
}