const mongoose = require("mongoose");

const PostSchema = mongoose.Schema(
  {
    image: [
      {
        type: String,
      },
    ],
    desc: {
      type: String,
    },
    postedBy: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    likes: [
      {
        likedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        likedDate: { type: String },
      },
    ],
    disLikes: [
      {
        disLikedBy: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        disLikedDate: { type: String },
      },
    ],
    numOfLikes: {
      type: Number,
      default: 0,
    },
    numOfDisLikes: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: String,
    },
    comments: [
      { commentId: { type: mongoose.Schema.Types.ObjectId, ref: "Comment" } },
    ],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

PostSchema.virtual("commentData", {
  ref: "Comment",
  localField: "_id",
  foreignField: "commentedPost",
  justOne: false,
  options: {
    select: "comment commentedBy commentDate dateUpdated",
    populate: {
      path: "commentedBy",
      select: "username profilePic",
    },
  },
});

module.exports = mongoose.model("Posts", PostSchema);
