const mongoose = require("mongoose");
const mailSender = require("../utils/mailSender");
const emailTemplate = require("../mail/templates/emailVerificationTemplate");

const OTPSchema = new mongoose.Schema({
	email:{
		type:String,
		required:true
	},
	otp:{
		type:String,
		required:true
	},
	createdAt:{
		type:Date,
		default:Date.now,
		expires:5*60
	}
});

async function sendVerificationEmail(email,otp){
	try{
		const mailResponse = await mailSender(
			email,
			"Verification Email",
			emailTemplate(otp)
		);
		console.log("Email Sent Successfully:",mailResponse.response);
	}
	catch(error){
		console.error("Error sending mail:",error);
		throw error;
	}
}

OTPSchema.pre("save", async function() {
	if(this.isNew){
		await sendVerificationEmail(this.email,this.otp);
	}
	
});

module.exports = mongoose.model("OTP",OTPSchema);