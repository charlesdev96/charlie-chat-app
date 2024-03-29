const Comments = require("../models/Comments");
const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

// Function to validate email format using regex
const isEmailValid = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const userProfile = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findOne({ _id: userId })
      .select("-password -__v")
      .populate({ path: "followers.followerId", select: "username profilePic" })
      .populate({
        path: "followings.followeeId",
        select: "username profilePic",
      })
      .populate({
        path: "posts.postId",
        select: "image desc numOfLikes numOfDisLikes comments createdAt",
        populate: {
          path: "comments.commentId",
          select: "_id comment commentDate dateUpdated commentedBy",
          populate: {
            path: "commentedBy",
            select: "_id username profilePic",
          },
        },
      });

    // Remove followerId key and keep only the values with followedAt
    const followers = user.followers.map(({ followerId, followedAt }) => ({
      ...followerId.toObject(),
      followedAt,
    }));

    // Remove followeeId key and keep only the values with followedAt
    const followings = user.followings.map(({ followeeId, followedAt }) => ({
      ...followeeId.toObject(),
      followedAt,
    }));

    //Remove postId, commentedBy and commentedId keys keep only the values
    const posts = user.posts.map(({ postId }) => ({
      ...postId.toObject(),
      comments: postId.comments.map(({ commentId }) => ({
        commentId: commentId._id,
        comment: commentId.comment,
        commentDate: commentId.commentDate,
        dateUpdated: commentId.dateUpdated,
        commentedById: commentId.commentedBy._id,
        commentedByUsername: commentId.commentedBy.username,
        commentedByProfilePic: commentId.commentedBy.profilePic,
      })),
    }));

    // Construct the updated user object
    const updatedUser = {
      ...user.toObject(),
      followers,
      followings,
      posts,
    };

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }
    const username = user.username;
    res.status(StatusCodes.OK).json({
      success: true,
      message: `Great to see you again, ${username}. Here are your profile details.`,
      data: updatedUser,
    });
  } catch (error) {
    console.log(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to display user profile",
      error: error,
    });
  }
};

const updateAccount = async (req, res) => {
  if (!req.user || !req.user.userId) {
    return res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "To access this feature, please log in or sign up." });
  }

  const {
    email,
    phoneNumber,
    oldPassword,
    newPassword,
    confirmNewPassword,
    profilePic,
    coverPic,
    desc,
    relationship,
    role,
    username,
    from,
  } = req.body;

  try {
    const userId = req.user.userId;
    //check if user exist
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User does not exist" });
    }
    //update fields if provided
    if (username) user.username = username;
    if (email) {
      if (!isEmailValid(email)) {
        return res.status(StatusCodes.BAD_REQUEST).json({
          error: "Invalid email format. Please enter a valid email address.",
        });
      }
      user.email = email;
    }
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (from) user.from = from;
    if (profilePic) user.profilePic = profilePic;
    if (coverPic) user.coverPic = coverPic;
    if (desc) user.desc = desc;
    if (relationship) user.relationship = relationship;
    if (role) user.role = role;
    if (oldPassword && newPassword && confirmNewPassword) {
      const isPasswordCorrect = await user.comparePassword(oldPassword);
      if (!isPasswordCorrect) {
        return res
          .status(StatusCodes.UNAUTHORIZED)
          .json({ error: "old password must match current password" });
      }
      if (!confirmNewPassword) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "Confirm new password is required" });
      }
      if (newPassword !== confirmNewPassword) {
        return res
          .status(StatusCodes.BAD_REQUEST)
          .json({ error: "New passwords do not match" });
      }
      user.password = newPassword;
    }

    //save the updated user
    await user.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "User account updated successfully",
      data: user,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to update account.",
    });
    console.log(error);
  }
};

const deleteAccount = async (req, res) => {
  try {
    const userId = req.user.userId;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }

    // Send a confirmation prompt to the user including re-entering phone number
    res.status(StatusCodes.OK).json({
      status: "prompt",
      message: "To confirm account deletion, please re-enter your username.",
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to delete account.",
    });
    console.log(error);
  }
};

const confirmDeleteAccount = async (req, res) => {
  const { providedUsername } = req.body;
  if (!providedUsername) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "Please provide username" });
  }
  const userId = req.user.userId;
  const user = await User.findOne({ _id: userId });
  if (!user) {
    return res.status(StatusCodes.NOT_FOUND).json({ error: "User not found" });
  }
  const username = user.username;

  // Validate that the provided phone number matches the user's phone number
  if (providedUsername !== username) {
    return res
      .status(StatusCodes.BAD_REQUEST)
      .json({ error: "username did not match" });
  }

  //Proceed with deleting the user account
  await user.deleteOne();
  res.status(StatusCodes.OK).json({
    success: true,
    message:
      "Your account has been successfully deleted. We're sorry to see you go! If you ever decide to come back, we'll be here. Thank you for being part of our community.",
  });
};

const getSingleUser = async (req, res) => {
  const id = req.params.id;
  try {
    const user = await User.findOne({ _id: id })
      .select("-password -role -updatedAt")
      .populate({
        path: "followers.followerId",
        select: "username profilePic numOfFollowers numOfFollowings",
      })
      .populate({
        path: "followings.followeeId",
        select: "username profilePic numOfFollowers numOfFollowings",
      })
      .populate({
        path: "posts.postId",
        select: "image desc numOfLikes numOfDisLikes comments createdAt",
        populate: {
          path: "comments.commentId",
          select: "_id comment commentDate dateUpdated commentedBy",
          populate: {
            path: "commentedBy",
            select: "_id username profilePic",
          },
        },
      });

    // Remove followerId key and keep only the values with followedAt
    const followers = user.followers.map(({ followerId, followedAt }) => ({
      ...followerId.toObject(),
      followedAt,
    }));

    // Remove followeeId key and keep only the values with followedAt
    const followings = user.followings.map(({ followeeId, followedAt }) => ({
      ...followeeId.toObject(),
      followedAt,
    }));

    //Remove postId, commentedBy and commentedId keys keep only the values
    const posts = user.posts.map(({ postId }) => ({
      ...postId.toObject(),
      comments: postId.comments.map(({ commentId }) => ({
        commentId: commentId._id,
        comment: commentId.comment,
        commentDate: commentId.commentDate,
        dateUpdated: commentId.dateUpdated,
        commentedById: commentId.commentedBy._id,
        commentedByUsername: commentId.commentedBy.username,
        commentedByProfilePic: commentId.commentedBy.profilePic,
      })),
    }));

    // Construct the updated user object
    const updatedUser = {
      ...user.toObject(),
      followers,
      followings,
      posts,
    };

    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ success: false, message: "User not found" });
    }

    res.status(StatusCodes.OK).json({
      success: true,
      meesage: "User information retrieved successfully.",
      data: updatedUser,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to get user account.",
    });
    console.log(error);
  }
};

const searchUser = async (req, res) => {
  const { username, phoneNumber } = req.query;
  try {
    // Build the query based on provided parameters
    const query = {};
    if (username) {
      query.username = { $regex: new RegExp(username, "i") }; // Case-insensitive search
    }
    if (phoneNumber) {
      query.phoneNumber = { $regex: new RegExp(phoneNumber, "i") }; // Case-insensitive search
    }

    // If no specific search criteria, return all posts
    let users = await User.find(query || {})
      .select("-password -role -updatedAt")
      .populate({
        path: "followers.followerId",
        select: "username profilePic numOfFollowers numOfFollowings",
      })
      .populate({
        path: "followings.followeeId",
        select: "username profilePic numOfFollowers numOfFollowings",
      })
      .populate({
        path: "posts.postId",
        select: "image desc numOfLikes numOfDisLikes comments createdAt",
        populate: {
          path: "comments.commentId",
          select: "_id comment commentDate dateUpdated commentedBy",
          populate: {
            path: "commentedBy",
            select: "_id username profilePic",
          },
        },
      })
      .exec();

    // If no matches found, perform partial matches and return results
    if (users.length === 0) {
      const partialMatchQuery = {};
      if (desc) {
        partialMatchQuery.desc = { $regex: new RegExp(desc, "i") };
      }

      users = await User.find(partialMatchQuery)
        .select("-password -role -updatedAt")
        .populate({
          path: "followers.followerId",
          select: "username profilePic numOfFollowers numOfFollowings",
        })
        .populate({
          path: "followings.followeeId",
          select: "username profilePic numOfFollowers numOfFollowings",
        })
        .populate({
          path: "posts.postId",
          select: "image desc numOfLikes numOfDisLikes comments createdAt",
          populate: {
            path: "comments.commentId",
            select: "_id comment commentDate dateUpdated commentedBy",
            populate: {
              path: "commentedBy",
              select: "_id username profilePic",
            },
          },
        })
        .exec();
    }
    // Iterate over each user to process their followers, followings, and posts
    const updatedUsers = users.map((user) => {
      // Remove followerId key and keep only the values with followedAt
      const followers = user.followers.map(({ followerId, followedAt }) => ({
        ...followerId.toObject(),
        followedAt,
      }));

      // Remove followeeId key and keep only the values with followedAt
      const followings = user.followings.map(({ followeeId, followedAt }) => ({
        ...followeeId.toObject(),
        followedAt,
      }));

      // Remove postId, commentedBy, and commentedId keys keep only the values
      const posts = user.posts.map(({ postId }) => ({
        ...postId.toObject(),
        comments: postId.comments.map(({ commentId }) => ({
          commentId: commentId._id,
          comment: commentId.comment,
          commentDate: commentId.commentDate,
          dateUpdated: commentId.dateUpdated,
          commentedById: commentId.commentedBy._id,
          commentedByUsername: commentId.commentedBy.username,
          commentedByProfilePic: commentId.commentedBy.profilePic,
        })),
      }));

      // Construct the updated user object
      return {
        ...user.toObject(),
        followers,
        followings,
        posts,
      };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message:
        "Hooray!, Your social media companion has been located. Get ready for some epic connections!",
      numOfUsers: updatedUsers.length,
      data: updatedUsers,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to complete search.",
    });
    console.log(error);
  }
};

module.exports = {
  userProfile,
  updateAccount,
  deleteAccount,
  confirmDeleteAccount,
  getSingleUser,
  searchUser,
};
