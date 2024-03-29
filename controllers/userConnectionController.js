const User = require("../models/User");
const mongoose = require("mongoose");
const { StatusCodes } = require("http-status-codes");

const followUser = async (req, res) => {
  //we will be having two ids which are
  //1. req.params.id which the user you want to follow
  //2. req.user.userId which is the id of the current user
  const userId = req.user.userId;
  const targetUserId = req.params.id;
  try {
    //user currently logged in
    const currentUser = await User.findOne({ _id: userId });
    //the target user current user wants to follower
    const targetUser = await User.findOne({ _id: targetUserId });

    //check if users exist
    if (!currentUser) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "user not found" });
    }
    //check if user you want to follow exist
    if (!targetUser) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "target user not found" });
    }

    //you cannot follow yourself
    if (userId === targetUserId) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error:
          "You cannot follow yourself. Please select another user to follow.",
      });
    }
    const username = targetUser.username;

    // Check if targetUserId already exists in currentUser's followings array
    const alreadyFollowing = currentUser.followings.some(
      (following) => following.followeeId.toString() === targetUserId.toString()
    );

    //push the targetUserId into the user followings array and also push the userId into the targetUser followers array
    if (!alreadyFollowing) {
      await currentUser.followings.push({
        followeeId: targetUserId,
        followedAt: new Date().toString(),
      });
      await targetUser.followers.push({
        followerId: userId,
        followedAt: new Date().toString(),
      });
      currentUser.numOfFollowings += 1;
      targetUser.numOfFollowers += 1;
    } else {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: `You are already following ${username}` });
    }

    await currentUser.save();
    await targetUser.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Congratulations!!!, you are now following ${username}`,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to follow user",
      error: error,
    });
  }
};

const unFollowUser = async (req, res) => {
  const userId = req.user.userId;
  const targetUserId = req.params.id;
  try {
    //user currently logged in
    const currentUser = await User.findOne({ _id: userId });
    //the target user current user wants to follower
    const targetUser = await User.findOne({ _id: targetUserId });

    //check if users exist
    if (!currentUser) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "user not found" });
    }
    //check if user you want to follow exist
    if (!targetUser) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "target user not found" });
    }
    const username = targetUser.username;

    // Check if currentUser is already following targetUser
    const isFollowing = currentUser.followings.some(
      (following) => following.followeeId.toString() === targetUserId.toString()
    );
    if (!isFollowing) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: `You are not currently following ${username}` });
    }

    // Remove targetUserId from currentUser's followings array
    currentUser.followings = currentUser.followings.filter(
      (following) => following.followeeId.toString() !== targetUserId.toString()
    );

    // Remove userId from targetUser's followers array
    targetUser.followers = targetUser.followers.filter(
      (follower) => follower.followerId.toString() !== userId.toString()
    );

    if (currentUser.followings.length < currentUser.numOfFollowings) {
      currentUser.numOfFollowings = currentUser.followings.length;
    }

    if (targetUser.followers.length < targetUser.numOfFollowers) {
      targetUser.numOfFollowers = targetUser.followers.length;
    }

    await currentUser.save();
    await targetUser.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Congratulations!!!, you have successfully unfollowed ${username}`,
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to unfollow user",
      error: error,
    });
  }
};

const getAllFollowers = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate({
      path: "followers.followerId",
      select: "_id username profilePic numOfFollowers numOfFollowings",
      options: { lean: true }, // To ensure Mongoose returns plain JavaScript objects
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    const followers = user.followers.map((follower) => ({
      followerId: follower.followerId._id,
      username: follower.followerId.username,
      profilePic: follower.followerId.profilePic,
      numOfFollowers: follower.followerId.numOfFollowers,
      numOfFollowings: follower.followerId.numOfFollowings,
      followedAt: follower.followedAt,
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Successfully retrieved ${followers.length} number of followers.`,
      data: followers,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to retrieve followers with details",
      error: error.message,
    });
  }
};

const getAllFollowings = async (req, res) => {
  try {
    const userId = req.user.userId;

    const user = await User.findById(userId).populate({
      path: "followings.followeeId",
      select: "_id username profilePic numOfFollowers numOfFollowings",
      options: { lean: true }, // To ensure Mongoose returns plain JavaScript objects
    });

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    const followings = user.followings.map((following) => ({
      followeeId: following.followeeId._id,
      username: following.followeeId.username,
      profilePic: following.followeeId.profilePic,
      numOfFollowers: following.followeeId.numOfFollowers,
      numOfFollowings: following.followeeId.numOfFollowings,
      followedAt: following.followedAt,
    }));

    res.status(StatusCodes.OK).json({
      success: true,
      message: `Successfully retrieved ${followings.length} number of user followings.`,
      data: followings,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to retrieve user followings with details",
      error: error.message,
    });
  }
};

module.exports = {
  followUser,
  unFollowUser,
  getAllFollowers,
  getAllFollowings,
};
