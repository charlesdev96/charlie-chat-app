const cloudinary = require("cloudinary").v2;
const { StatusCodes } = require("http-status-codes");
const fs = require("fs");

//Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const uploadDocuments = async (req, res) => {
  try {
    //check when no file is uploaded
    if (!req.files || Object.keys(req.files).length === 0) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        status: "error",
        message: "No files were uploaded.",
      });
    }
    const results = [];

    //check if req.files.files is an array or single file
    const filesArray = Array.isArray(req.files.files)
      ? req.files.files
      : [req.files.files];

    //loop through each uploaded file
    for (const file of filesArray) {
      //update the cloudinary upload options to support videos
      const result = await cloudinary.uploader.upload(file.tempFilePath, {
        resource_type: "auto", //Automatically detect the file type
        folder: "chat-app",
      });

      //Remove the temporary file
      fs.unlink(file.tempFilePath, (unlinkError) => {
        if (unlinkError) {
          console.error(`Error deleting temporary file: ${unlinkError}`);
        } else {
          console.log(`Temporary file deleted: ${file.tempFilePath}`);
        }
      });

      results.push({ src: result.secure_url });
    }

    return res.status(StatusCodes.OK).json({
      status: "success",
      message: "File successfully uploaded to Cloudinary!",
      files: results,
    });
  } catch (error) {
    console.log(error);
  }
};

module.exports = { uploadDocuments };
