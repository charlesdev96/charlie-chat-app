const express = require("express");
const router = express.Router();

const { uploadDocuments } = require("../controllers/fileUploadController");

router.post("/file-upload", uploadDocuments);

module.exports = router;
