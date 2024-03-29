const mongoose = require("mongoose");

const CommentSchema = mongoose.Schema(
  {
    comment: {
      type: String,
    },
    commentedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    commentDate: {
      type: String,
    },
    dateUpdated: {
      type: String,
    },
    commentedPost: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Posts",
    },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Comment", CommentSchema);
