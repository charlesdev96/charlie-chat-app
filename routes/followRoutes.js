const express = require("express");
const router = express.Router();

const {
  followUser,
  unFollowUser,
  getAllFollowers,
  getAllFollowings,
} = require("../controllers/userConnectionController");

const { authenticateUser } = require("../middleware/authentication");

//get all followers
router.get("/get-followers", authenticateUser, getAllFollowers);

//get all user followings
router.get("/get-followings", authenticateUser, getAllFollowings);

//follow user route
router.patch("/follow-user/:id", authenticateUser, followUser);

//unfollow user route
router.patch("/unfollow-user/:id", authenticateUser, unFollowUser);

module.exports = router;
