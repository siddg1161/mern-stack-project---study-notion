const cloudinary = require('cloudinary').v2
const path = require('path')

exports.uploadImageToCloudinary = async (file, folder, height, quality) => {
    const options = { folder };
    if (height) options.height = height;
    if (quality) options.quality = quality;
    options.resource_type = "auto";

    const absolutePath = path.resolve(file.tempFilePath)
    return await cloudinary.uploader.upload(absolutePath, options)
}