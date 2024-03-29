const express = require("express");
const router = express.Router();

const {
  createComment,
  updateComment,
  deleteComment,
} = require("../controllers/commentController");

const { authenticateUser } = require("../middleware/authentication");

//create comment route
router.post("/create-comment/:id", authenticateUser, createComment);

//update comment route
router.patch("/update-comment/:id", authenticateUser, updateComment);

//delete comment route
router.delete("/delete-comment/:id", authenticateUser, deleteComment);

module.exports = router;
