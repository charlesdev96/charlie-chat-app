const User = require("../models/User");
const Post = require("../models/Post");
const Comment = require("../models/Comments");
const { StatusCodes } = require("http-status-codes");

const createComment = async (req, res) => {
  const userId = req.user.userId;
  const postId = req.params.id;
  try {
    //check user
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
    req.body.commentedBy = userId;
    req.body.commentDate = new Date().toString();
    req.body.dateUpdated = new Date().toString();
    req.body.commentedPost = postId;

    const comment = await Comment.create(req.body);
    const commentId = comment._id;
    await post.comments.push({ commentId: commentId });
    await post.save();
    res
      .status(StatusCodes.CREATED)
      .json({ success: true, message: "Comment added!", data: comment });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to comment on post",
      error: error,
    });
  }
};

const updateComment = async (req, res) => {
  const userId = req.user.userId;
  const commentId = req.params.id;
  try {
    const { comment } = req.body;
    //check user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }
    //check comment
    const comments = await Comment.findOne({ _id: commentId });
    if (!comments) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Comment not found" });
    }

    if (userId.toString() !== comments.commentedBy.toString()) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Hold on a second! You can only edit your own posts." });
    }
    comments.comment = comment;
    comments.dateUpdated = new Date().toString();
    await comments.save();
    res.status(StatusCodes.OK).json({
      success: true,
      message: "Your comment has been updated.",
      data: comments,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to update comment",
      error: error,
    });
  }
};

const deleteComment = async (req, res) => {
  const userId = req.user.userId;
  const commentId = req.params.id;
  const { postId } = req.body;
  try {
    //check user
    const user = await User.findOne({ _id: userId });
    if (!user) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "User not found" });
    }
    //check comment
    const comment = await Comment.findOne({ _id: commentId });
    if (!comment) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Comment not found" });
    }

    //check if post exist
    const post = await Post.findOne({ _id: postId });
    if (!post) {
      return res
        .status(StatusCodes.NOT_FOUND)
        .json({ error: "Post not found" });
    }

    //check if comment belong to user
    if (
      userId.toString() !== comment.commentedBy.toString() &&
      user.role !== "admin"
    ) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Hold on a second! You can only delete your own posts.",
      });
    }

    post.comments = post.comments.filter(
      (commentIds) => commentIds.commentId.toString() !== commentId.toString()
    );
    await post.save();
    //proceed to delete comment
    await Comment.deleteOne();

    res.status(StatusCodes.OK).json({
      success: true,
      message: "Your comment has been deleted.",
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to delete comment",
      error: error,
    });
  }
};

module.exports = {
  createComment,
  updateComment,
  deleteComment,
};
