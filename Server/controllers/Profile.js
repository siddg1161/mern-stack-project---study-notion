const Profile= require("../models/Profile");
const User= require("../models/User");
const Course = require("../models/Course");
const { uploadImageToCloudinary } = require("../utils/imageUploader")
const mongoose = require("mongoose");
const CourseProgress = require("../models/CourseProgress")

exports.updateProfile = async(req,res) => {
    try{
       //get data
       const{dateOfBirth="", about="", contactNumber, gender} = req.body;

       //get userId
       const id= req.user.id;

       //validation
       if(!contactNumber || !gender || !id)
       {
        return res.status(400).json({
            success:false,
            message:"All fields are required"
        })
       }
       //find profile
       const userDetails= await User.findById(id);
       const profileId = userDetails.additionalDetails;
       const profileDetails = await Profile.findById(profileId);

       //updateprofile
       profileDetails.dateOfBirth=dateOfBirth;
       profileDetails.about=about;
       profileDetails.gender=gender;
       profileDetails.contactNumber=contactNumber;
       await profileDetails.save();

          // ✅ ADD THESE TWO LINES
       const updatedUserDetails = await User.findById(id)
           .populate("additionalDetails")
           .exec();

       //return res
       return res.status(200).json({
        success:true,
        message:"Profile Updated Succesfully",
        updatedUserDetails
       })
    }
    catch(error)
    {
       return res.status(500).json({
        success:false,
        message:"Unable to update Profile please try again",
        error:error.message,
      })
    }
}

//deleteAccount handler
exports.deleteAccount = async (req, res) => {
  try {
    const id = req.user.id
    console.log(id)
    const user = await User.findById({ _id: id })
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      })
    }
    // Delete Assosiated Profile with the User
    await Profile.findByIdAndDelete({
      _id: new mongoose.Types.ObjectId(user.additionalDetails),
    })
    for (const courseId of user.courses) {
      await Course.findByIdAndUpdate(
        courseId,
        { $pull: { studentsEnroled: id } },
        { new: true }
      )
    }
    // Now Delete User
    await User.findByIdAndDelete({ _id: id })

    await CourseProgress.deleteMany({ userId: id })

    res.status(200).json({
      success: true,
      message: "User deleted successfully",
    })
    await CourseProgress.deleteMany({ userId: id })
  } catch (error) {
    console.log(error)
    res
      .status(500)
      .json({ success: false, message: "User Cannot be deleted successfully" })
  }
}

exports.getAllUserDetails = async(req,res) => {
    try{
        //getid
        const id= req.user.id;
        //validation and get user details
        const userDetails= await User.findById(id).populate("additionalDetails").exec();
        //return res
        return res.status(200).json({
        success:true,
        message:"User Adata fetched Succesfully",
        data: userDetails,
       })

    }
    catch(error)
    {
      return res.status(500).json({
        success:false,
        error:error.message,
      })
    }
}

exports.updateDisplayPicture = async (req, res) => {
  try {
    console.log("FILES:", req.files);

    if (!req.files || !req.files.displayPicture) {
      return res.status(400).json({
        success: false,
        message: "No file uploaded",
      });
    }

    const displayPicture = req.files.displayPicture;
    const userId = req.user.id;

    console.log("Uploading to Cloudinary...");  // 🔥 ADD
    console.log("FOLDER:", process.env.FOLDER_NAME);  // 🔥 ADD

    const image = await uploadImageToCloudinary(
      displayPicture,
      process.env.FOLDER_NAME,
      1000,
      1000
    );

    console.log("CLOUDINARY RESPONSE:", image); // 🔥 ADD

    const updatedProfile = await User.findByIdAndUpdate(
      { _id: userId },
      { image: image.secure_url },
      { new: true }
    );

    return res.json({
      success: true,
      message: "Image Updated successfully",
      data: updatedProfile,
    });

  } catch (error) {
    console.log("UPLOAD ERROR:", error); // 🔥 IMPORTANT
    return res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

exports.getEnrolledCourses = async (req, res) => {
  try {
    const userId = req.user.id
    let userDetails = await User.findOne({
      _id: userId,
    })
      .populate({
        path: "courses",
        populate: {
          path: "courseContent",
          populate: {
            path: "subSection",
          },
        },
      })
      .exec()
    userDetails = userDetails.toObject()
    var SubsectionLength = 0
    for (var i = 0; i < userDetails.courses.length; i++) {
      let totalDurationInSeconds = 0
      SubsectionLength = 0
      for (var j = 0; j < userDetails.courses[i].courseContent.length; j++) {
        totalDurationInSeconds += userDetails.courses[i].courseContent[
          j
        ].subSection.reduce((acc, curr) => acc + parseInt(curr.timeDuration), 0)
        userDetails.courses[i].totalDuration = convertSecondsToDuration(
          totalDurationInSeconds
        )
        SubsectionLength +=
          userDetails.courses[i].courseContent[j].subSection.length
      }
      let courseProgressCount = await CourseProgress.findOne({
        courseID: userDetails.courses[i]._id,
        userId: userId,
      })
      courseProgressCount = courseProgressCount?.completedVideos.length
      if (SubsectionLength === 0) {
        userDetails.courses[i].progressPercentage = 100
      } else {
        // To make it up to 2 decimal point
        const multiplier = Math.pow(10, 2)
        userDetails.courses[i].progressPercentage =
          Math.round(
            (courseProgressCount / SubsectionLength) * 100 * multiplier
          ) / multiplier
      }
    }

    if (!userDetails) {
      return res.status(400).json({
        success: false,
        message: `Could not find user with id: ${userDetails}`,
      })
    }
    return res.status(200).json({
      success: true,
      data: userDetails.courses,
    })
  } catch (error) {
    return res.status(500).json({
      success: false,
      message: error.message,
    })
  }
}

