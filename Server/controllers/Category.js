const Category= require("../models/category");

function getRandomInt(max) {
    return Math.floor(Math.random() * max)
  }

//create tag ka handler function
exports.createCategory= async (req,res) => {
    try{
        //fetch data
        const {name,description} = req.body;
        
        //validation
        if(!name || !description)
        {
            return res.status(400).json({
                success:false,
                message:"All fields are required"
            })
        }

        //create entry in DB
        const categoryDetails= await Category.create({
            name:name,
            description:description,
        })

        //return res
        return res.status(200).json({
           success:true,
           message:"Category created successfully"
        })
    } 
    catch(error)
    {
        console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//getalltags handler function
exports.showAllCategories = async(req,res) => {
    try{
      const allCategory= await Category.find({});

        //return res
        return res.status(200).json({
           success:true,
           message:"All Categories returned succesffully",
           data: allCategory,
        })
    }
    catch(error)
    {
      console.log(error);
        return res.status(500).json({
            success:false,
            message:error.message,
        })
    }
}

//categoryPageDetails 

exports.categoryPageDetails = async (req, res) => {
  try {
    //get category id
    const {categoryId}= req.body;
    //get courses for specified category id
    const selectedCategory = await Category.findById(categoryId)
                                             .populate("courses")
                                             .exec();
    //validation
    if(!selectedCategory)
    {
      return res.status(404).json({
        success:false,
        message:"Data not found"
      })
    }
    //get courses for diff category
    const differentCategories = await Category.find({
                                            _id : {$ne: categoryId},    //ne= not equal
                                            })
                                            .populate("courses")
                                            .exec();
    //get top selling coursesw
     //hw
     const allCategories = await Category.find()
        .populate({
          path: "courses",
          match: { status: "Published" },
          populate: {
            path: "instructor",
        },
        })
        .exec()
      const allCourses = allCategories.flatMap((category) => category.courses)
      const mostSellingCourses = allCourses
        .sort((a, b) => b.sold - a.sold)
        .slice(0, 10)
    //return rsponse
    return res.status(200).json({
      success:true,
      data:{
        selectedCategory,
        differentCategories,
        mostSellingCourses
      }
    })
      
  } 
  catch (error) 
  {
   return res.status(500).json({
     success: false,
     message: "Internal server error",
     error: error.message,
   });
  }
}