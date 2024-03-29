const express = require("express");
const router = express.Router();

const {
  createPost,
  updatePost,
  deletePost,
  likePost,
  disLikePost,
  getPost,
  timeLinePost,
  searchPost,
} = require("../controllers/postController");

const { authenticateUser } = require("../middleware/authentication");

//create post route
router.post("/create-post", authenticateUser, createPost);

//get time line post
router.get("/time-line-post", authenticateUser, timeLinePost);

//search for post routes
router.get("/search-post", authenticateUser, searchPost);

//get single post
router.get("/get-post/:id", authenticateUser, getPost);

//update post route
router.patch("/update-post/:id", authenticateUser, updatePost);

//like a post router
router.patch("/like-post/:id", authenticateUser, likePost);

//dislike a post router
router.patch("/dislike-post/:id", authenticateUser, disLikePost);

//delete post
router.delete("/delete-post/:id", authenticateUser, deletePost);

module.exports = router;
