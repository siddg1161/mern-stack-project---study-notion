const Section =  require("../models/Section");
const Course = require("../models/Course");
const SubSection = require("../models/SubSection");


//createsection handler
exports.createSection = async(req,res) => {
    try{
      //data fetch
      const{sectionName, courseId} = req.body;
      //data validation
      if(!sectionName || !courseId)
      {
        return res.status(400).json({
            success:false,
            message:"missing properties"
        })
      }
      //create section
      const newSection = await Section.create({sectionName})
      //course update with section objectId
      const updatedCourseDetails = await Course.findByIdAndUpdate(
        courseId,
        {
            $push:{
                courseContent:newSection._id,
            },
        },
        {new:true}
      ).populate({
				path: "courseContent",
				populate: {
					path: "subSection",
				},
			})
			.exec();
      //return res
      return res.status(200).json({
        success:true,
        message:"section created successfully",
        updatedCourseDetails,
      })
    }
    catch(error)
    {
      return res.status(500).json({
        success:false,
        message:"Unable to create section please try again",
        error:error.message,
      })
    }
}

//update section function handler
exports.updateSection = async(req,res) => {
    try{
       console.log("UPDATE SECTION BODY:", req.body) 
        //fetch data
        const{sectionName, sectionId, courseId} = req.body;

        //validation
        if(!sectionName || !sectionId || !courseId)
        {
            return res.status(400).json({
                success:false,
                message:"missing Properties"
            })
        }
        //update data
        const section = await Section.findByIdAndUpdate(sectionId, {sectionName}, {new:true})

        const updatedCourse = await Course.findById(courseId)
        .populate({ path: "courseContent", populate: { path: "subSection" } })
        .exec()

        //return res
        return res.status(200).json({
        success:true,
        message:"section updated successfully",
        updatedCourseDetails: updatedCourse, 
        })
    }
    catch(error)
    {
        
      return res.status(500).json({
        success:false,
        message:"Unable to update section please try again",
        error:error.message,
      })
    }
}

//delete section handler
exports.deleteSection = async (req, res) => {
	try {

		const { sectionId, courseId }  = req.body;
		await Course.findByIdAndUpdate(courseId, {
			$pull: {
				courseContent: sectionId,
			}
		})
		const section = await Section.findById(sectionId);
		console.log(sectionId, courseId);
		if(!section) {
			return res.status(404).json({
				success:false,
				message:"Section not Found",
			})
		}

		//delete sub section
		await SubSection.deleteMany({_id: {$in: section.subSection}});

		await Section.findByIdAndDelete(sectionId);

		//find the updated course and return 
		const course = await Course.findById(courseId).populate({
			path:"courseContent",
			populate: {
				path: "subSection"
			}
		})
		.exec();

		res.status(200).json({
			success:true,
			message:"Section deleted",
			data:course
		});
	} catch (error) {
		console.error("Error deleting section:", error);
		res.status(500).json({
			success: false,
			message: "Internal server error",
		});
	}
};   
   
