const User = require("../models/User");
const Post = require("../models/Post");
const { StatusCodes } = require("http-status-codes");

const createPost = async (req, res) => {
  const userId = req.user.userId;
  try {
    //check if user exist
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res.status(StatusCodes.NOT_FOUND);
    }
    req.body.postedBy = req.user.userId;
    req.body.createdAt = new Date();
    //create post
    const post = await Post.create(req.body);
    //push post id
    user.posts.push({ postId: post._id });
    await user.save();
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Post created successfully!",
      data: post,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to create post.",
    });
    console.log(error);
  }
};

const updatePost = async (req, res) => {
  const userId = req.user.userId;
  const { image, desc } = req.body;
  try {
    const postId = req.params.id;
    const post = await Post.findOne({ _id: postId });
    //check if post exist
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Post not found" });
    }
    //check if post belongs to user
    if (userId.toString() !== post.postedBy.toString()) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error:
          "Oops! It looks like you can't edit this post. Only the author can make changes.",
      });
    }
    if (image) post.image = image;
    if (desc) post.desc = desc;
    await post.save();
    res
      .status(StatusCodes.OK)
      .json({ suceess: true, message: "Your post has been updated." });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to update post.",
    });
    console.log(error);
  }
};

const deletePost = async (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.id;
  try {
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Post not found" });
    }

    //check if post belongs to user or user is an admin
    if (
      userId.toString() !== post.postedBy.toString() &&
      user.role !== "admin"
    ) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error:
          "Oops! It looks like you can't delete this post. Only the author or an administrator can delete this post.",
      });
    }

    //remove from user data
    user.posts = user.posts.filter(
      (postIds) => postIds.postId.toString() !== postId.toString()
    );
    await user.save();

    //go ahead and delete post
    await post.deleteOne();
    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Your post has been deleted." });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to delete post.",
    });
    console.log(error);
  }
};

const likePost = async (req, res) => {
  const userId = req.user.userId;
  try {
    const postId = req.params.id;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }
    //check if post exist
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Post not found" });
    }

    //check if user has already liked the post
    const alreadyliked = post.likes.some(
      (like) => like.likedBy.toString() === userId.toString()
    );
    //if not liked before, push userId
    if (!alreadyliked) {
      await post.likes.push({
        likedBy: userId,
        likedDate: new Date().toString(),
      });

      //remove userId from dislike because you cant like and dislike same post
      post.disLikes = post.disLikes.filter(
        (undoDislike) => undoDislike.disLikedBy.toString() !== userId.toString()
      );
      post.numOfLikes = post.likes.length;
      post.numOfDisLikes = post.disLikes.length;
      //save post
      await post.save();
      return res
        .status(StatusCodes.OK)
        .json({ success: true, message: "You rock this post!" });
    } else {
      //undo the liked action
      post.likes = post.likes.filter(
        (undoLike) => undoLike.likedBy.toString() !== userId.toString()
      );
      //decrease number of likes
      post.numOfLikes = post.likes.length;
      post.numOfDisLikes = post.disLikes.length;
      //save post
      await post.save();
      return res
        .status(StatusCodes.OK)
        .json({ success: true, message: "Your like has been removed" });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to like post.",
    });
    console.log(error);
  }
};

const disLikePost = async (req, res) => {
  const userId = req.user.userId;
  try {
    const postId = req.params.id;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }
    //check if post exist
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Post not found" });
    }

    //check if user has already liked the post
    const alreadyDisliked = post.disLikes.some(
      (dislike) => dislike.disLikedBy.toString() === userId.toString()
    );
    //if not disliked before, push userId
    if (!alreadyDisliked) {
      await post.disLikes.push({
        disLikedBy: userId,
        disLikedDate: new Date().toString(),
      });
      // post.numOfDisLikes += 1;

      //remove userId from like because you cant like and dislike same post
      post.likes = post.likes.filter(
        (undoLike) => undoLike.likedBy.toString() !== userId.toString()
      );

      post.numOfLikes = post.likes.length;
      post.numOfDisLikes = post.disLikes.length;
      //save post
      await post.save();
      return res
        .status(StatusCodes.OK)
        .json({ success: true, message: "Your dislike has been registered." });
    } else {
      //undo the disliked action
      post.disLikes = post.disLikes.filter(
        (undoDislike) => undoDislike.disLikedBy.toString() !== userId.toString()
      );
      //decrease number of dislikes
      // post.numOfDisLikes -= 1;
      post.numOfLikes = post.likes.length;
      post.numOfDisLikes = post.disLikes.length;
      //save post
      await post.save();
      return res
        .status(StatusCodes.OK)
        .json({ success: true, message: "Second thoughts? We got you." });
    }
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to dislike post.",
    });
    console.log(error);
  }
};

const getPost = async (req, res) => {
  try {
    const userId = req.user.userId;
    const postId = req.params.id;
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }
    //check if post exist
    const post = await Post.findOne({ _id: postId })
      .select("-likes -disLikes")
      .populate({
        path: "postedBy",
        select: "username profilePic",
        options: { lean: true },
      })
      .populate({
        path: "comments.commentId",
        select: "_id comment commentDate dateUpdated commentedBy",
        populate: {
          path: "commentedBy",
          select: "_id username profilePic",
        },
      });

    //Remove postId, commentedBy and commentedId keys and keep only the values
    const comments = post.comments.map(({ commentId }) => ({
      _id: commentId._id,
      comment: commentId.comment,
      commentDate: commentId.commentDate,
      dateUpdated: commentId.dateUpdated,
      commentedById: commentId.commentedBy._id,
      commentedByUsername: commentId.commentedBy.username,
      commentedByProfilePic: commentId.commentedBy.profilePic,
    }));

    const updatedPost = {
      ...post.toObject(),
      comments,
    };

    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Post not found" });
    }

    res
      .status(StatusCodes.OK)
      .json({ success: true, message: "Here it is!", data: updatedPost });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      error: error,
      message: "Unable to display post.",
    });
    console.log(error);
  }
};

const timeLinePost = async (req, res) => {
  try {
    const userId = req.user.userId;

    // Get the user's followers and followings
    const user = await User.findById(userId).select("followers followings");
    const followerIds = user.followers.map((follower) => follower.followerId);
    const followingIds = user.followings.map(
      (following) => following.followeeId
    );

    // Find posts from the user
    const userPosts = await Post.find({ postedBy: userId })
      .select("-likes -disLikes -__v")
      .populate("postedBy", "username profilePic")
      .populate({
        path: "comments.commentId",
        select: "_id comment commentDate dateUpdated commentedBy",
        populate: {
          path: "commentedBy",
          select: "_id username profilePic",
        },
      })
      .sort({ createdAt: -1 });

    // Find posts from followings
    const followingPosts = await Post.find({ postedBy: { $in: followingIds } })
      .select("-likes -disLikes -__v")
      .populate("postedBy", "username profilePic")
      .populate({
        path: "comments.commentId",
        select: "_id comment commentDate dateUpdated commentedBy",
        populate: {
          path: "commentedBy",
          select: "_id username profilePic",
        },
      })
      .sort({ createdAt: -1 });

    // Find posts from followers
    const followerPosts = await Post.find({
      postedBy: { $in: followerIds },
    })
      .select("-likes -disLikes -__v")
      .populate("postedBy", "username profilePic")
      .populate({
        path: "comments.commentId",
        select: "_id comment commentDate dateUpdated commentedBy",
        populate: {
          path: "commentedBy",
          select: "_id username profilePic",
        },
      })
      .sort({ createdAt: -1 });

    // Find posts from all other users
    const otherPosts = await Post.find({
      postedBy: { $nin: [...followerIds, ...followingIds, userId] },
    })
      .select("-likes -disLikes -__v")
      .populate("postedBy", "username profilePic")
      .populate({
        path: "comments.commentId",
        select: "_id comment commentDate dateUpdated commentedBy",
        populate: {
          path: "commentedBy",
          select: "_id username profilePic",
        },
      })
      .sort({ createdAt: -1 });

    // Combine all posts into one array
    const allPosts = [
      ...userPosts,
      ...followingPosts,
      ...followerPosts,
      ...otherPosts,
    ];

    // Filter out duplicate posts
    const uniquePosts = Array.from(
      new Set(allPosts.map((post) => post._id.toString()))
    ).map((postId) => {
      return allPosts.find((post) => post._id.toString() === postId.toString());
    });

    // Extract comments from each post
    const updatedPosts = uniquePosts.map((post) => {
      const comments = post.comments.map(({ commentId }) => ({
        _id: commentId._id,
        comment: commentId.comment,
        commentDate: commentId.commentDate,
        dateUpdated: commentId.dateUpdated,
        commentedById: commentId.commentedBy._id,
        commentedByUsername: commentId.commentedBy.username,
        commentedByProfilePic: commentId.commentedBy.profilePic,
      }));
      return {
        ...post.toObject(),
        comments,
      };
    });

    res.status(StatusCodes.OK).json({
      success: true,
      message: "See what your friends are up to!",
      data: updatedPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to fetch timeline posts",
      error: error,
    });
  }
};

const searchPost = async (req, res) => {
  //search using post desc and createdAt
  const { desc } = req.query;
  const userId = req.user.userId;
  try {
    // Build the query based on provided parameters
    const query = {};
    if (desc) {
      query.desc = { $regex: new RegExp(desc, "i") }; // Case-insensitive search
    }

    // If no specific search criteria, return all posts
    let posts = await Post.find(query || {})
      .select("-likes -disLikes")
      .populate({
        path: "postedBy",
        select: "username profilePic",
      })
      .populate({
        path: "comments.commentId",
        select: "_id comment commentDate dateUpdated commentedBy",
        populate: {
          path: "commentedBy",
          select: "_id username profilePic",
        },
      })
      .exec();

    // If no matches found, perform partial matches and return results
    if (posts.length === 0) {
      const partialMatchQuery = {};
      if (desc) {
        partialMatchQuery.desc = { $regex: new RegExp(desc, "i") };
      }

      posts = await Post.find(partialMatchQuery)
        .select("-likes -disLikes")
        .populate({
          path: "postedBy",
          select: "username profilePic",
        })
        .populate({
          path: "comments.commentId",
          select: "_id comment commentDate dateUpdated commentedBy",
          populate: {
            path: "commentedBy",
            select: "_id username profilePic",
          },
        })
        .exec();
    }

    // Map through each post to extract comments
    const updatedPosts = posts.map((post) => {
      const comments = post.comments.map(({ commentId }) => ({
        _id: commentId._id,
        comment: commentId.comment,
        commentDate: commentId.commentDate,
        dateUpdated: commentId.dateUpdated,
        commentedById: commentId.commentedBy._id,
        commentedByUsername: commentId.commentedBy.username,
        commentedByProfilePic: commentId.commentedBy.profilePic,
      }));

      return {
        ...post.toObject(),
        comments,
      };
    });

    res.status(StatusCodes.OK).json({
      suceess: true,
      message: `We found ${updatedPosts.length} posts related to your search`,
      data: updatedPosts,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to complete search",
      error: error,
    });
  }
};

module.exports = {
  createPost,
  updatePost,
  deletePost,
  likePost,
  disLikePost,
  getPost,
  timeLinePost,
  searchPost,
};
