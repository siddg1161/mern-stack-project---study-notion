const {instance }= require("../config/razorpay");
const User = require("../models/User");
const Course = require("../models/Course");
const mailSender = require("../utils/mailSender");
const {courseEnrollemntDate} =require("../mail/templates/courseEnrollmentEmail");
const { default: mongoose } = require("mongoose");

//capture the payment and inititate the razorpay order
exports.capturePayment = async(req,res) => {
    
       //get UserID and CourseID
       const{course_id} = req.body;
       const userId=req.user.id;
       //validation
      
       //valid courseID 
        if(!course_id)
       {
        return res.json({
            success:false,
            message:"please provide valid course Id"
        })
       }

       
       //Valid COurseDetail
       let course;
       try{
        course= await Course.findById(course_id);
        if(!course)
        {
            return res.json({
                success:false,
                message:"could not find the course"
            })
        }

        //user already pay for the same course
        const uid = new mongoose.Types.ObjectId(userId); //convert userid into objectid
        if(course.studentsEnrolled.includes(uid))
        {
            return res.status(200).json({
                success:false,
                message:'Student is already enrolled'
            })
        }
       }
       catch(error)
       {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message
        })
       }

        //order create
        const amount = course.price;
        const currency = "INR";

        const options = {
            amount: amount*100,
            currency,
            receipt: Math.random(Date.now()).toString(),
            notes:{
                courseId: course_id,
                userId,
            }
        };

        try{
          //inititate the payment using razorpay
          const paymentResponse = await instance.orders.create(options);

          //return response
          return res.status(200).json({
            success:true,
            courseName:course.courseName,
            courseDescription: course.courseDescription,
            thumbnail:course.thumbnail,
            orderId:paymentResponse.id,
            currency:paymentResponse.currency,
            amount:paymentResponse.amount,
          })
        }
        catch(error)
        {
          console.log(error);
           return res.json({
            success:false,
            message:"Could not initiate error"
        })
        }
}

//verify signature of razorpay and server]
exports.verifySignature = async(req,res) =>{
  const webhookSecret="12345678";
  const signature = req.headers("x-razorpay-signature");

  const shasum = crypto.createHmac("sha256",webhookSecret);
  shasum.update(JSON.stringify(req.body));
  const digest = shasum.digest("hex");

  if(signature === digest)
  {
    console.log("Payment is Authorized");

    const {courseId,userId} = req.body.payload.payment.entity.notes;

    try{
        //fulfill the action

        //find the course and enroll the student in it
        const enrolledCourse= await Course.findOneAndUpdate(
                                    {_id: courseId},
                                    {$push: {studentsEnrolled: userId}},
                                    {new:true}
        )

        if(!enrolledCourse)
        {
            return res.status(500).json({
                success:false,
                message:"course not found"
            })
        }

        //find the stuydent and add the course to their list of enrolled courses
        const enrolledStudent = await User.findOneAndUpdate(
                                {_id: userId},
                                {$push:{
                                    courses:courseId
                                }},
                                {new:true}
        )

        //confirmation ka mial send
        const emailResponse= await mailSender(
                       enrolledStudent.email,
                       "Congratulations from CodeHelp",
                       "Congratulations you are onboarded into new CodeHelp COurse"
        )

        return res.status(200).json({
            success:true,
            message:"Signature Verified and Course Added"
        })
    }
    catch(error)
    {
       console.log(error);
       return res.status(500).json({
        success:false,
        message:error.message
       })
    }
  }

  else{
    return res.status(400).json({
        success:false,
        message:"Invalid Request"
    })
  }
}

//samjho inko bina samjhe copy kiya haiii

// Send Payment Success Email
exports.sendPaymentSuccessEmail = async (req, res) => {
  const { orderId, paymentId, amount } = req.body

  const userId = req.user.id

  if (!orderId || !paymentId || !amount || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please provide all the details" })
  }

  try {
    const enrolledStudent = await User.findById(userId)

    await mailSender(
      enrolledStudent.email,
      `Payment Received`,
      paymentSuccessEmail(
        `${enrolledStudent.firstName} ${enrolledStudent.lastName}`,
        amount / 100,
        orderId,
        paymentId
      )
    )
  } catch (error) {
    console.log("error in sending mail", error)
    return res
      .status(400)
      .json({ success: false, message: "Could not send email" })
  }
}

// enroll the student in the courses
const enrollStudents = async (courses, userId, res) => {
  if (!courses || !userId) {
    return res
      .status(400)
      .json({ success: false, message: "Please Provide Course ID and User ID" })
  }

  for (const courseId of courses) {
    try {
      // Find the course and enroll the student in it
      const enrolledCourse = await Course.findOneAndUpdate(
        { _id: courseId },
        { $push: { studentsEnroled: userId } },
        { new: true }
      )

      if (!enrolledCourse) {
        return res
          .status(500)
          .json({ success: false, error: "Course not found" })
      }
      console.log("Updated course: ", enrolledCourse)

      const courseProgress = await CourseProgress.create({
        courseID: courseId,
        userId: userId,
        completedVideos: [],
      })
      // Find the student and add the course to their list of enrolled courses
      const enrolledStudent = await User.findByIdAndUpdate(
        userId,
        {
          $push: {
            courses: courseId,
            courseProgress: courseProgress._id,
          },
        },
        { new: true }
      )

      console.log("Enrolled student: ", enrolledStudent)
      // Send an email notification to the enrolled student
      const emailResponse = await mailSender(
        enrolledStudent.email,
        `Successfully Enrolled into ${enrolledCourse.courseName}`,
        courseEnrollmentEmail(
          enrolledCourse.courseName,
          `${enrolledStudent.firstName} ${enrolledStudent.lastName}`
        )
      )

      console.log("Email sent successfully: ", emailResponse.response)
    } catch (error) {
      console.log(error)
      return res.status(400).json({ success: false, error: error.message })
    }
  }
}