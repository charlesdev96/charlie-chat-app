const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const UserSchema = new mongoose.Schema(
  {
    username: {
      type: String,
      required: true,
      unique: true,
      min: 5,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    phoneNumber: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
    },
    profilePic: {
      type: String,
      default:
        "https://res.cloudinary.com/duyoxmcxz/image/upload/v1710853324/chat-app/gyri2wzcahcyy2kdducn.png",
    },
    coverPic: {
      type: String,
      default:
        "https://res.cloudinary.com/duyoxmcxz/image/upload/v1710852717/chat-app/pcmloll41lgurbxa3uqy.jpg",
    },
    isAdmin: {
      type: Boolean,
      default: false,
    },
    desc: {
      type: String,
      default: "",
    },
    from: {
      type: String,
      default: "",
    },
    relationship: {
      type: String,
      enum: [
        "single",
        "engaged",
        "married",
        "divorced",
        "complicated",
        "dating",
      ],
      default: "single",
    },
    followers: [
      {
        followerId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        followedAt: { type: String },
      },
    ],
    followings: [
      {
        followeeId: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        followedAt: { type: String },
      },
    ],
    role: {
      type: String,
      enum: ["user", "admin"],
      default: "user",
    },
    numOfFollowers: {
      type: Number,
      default: 0,
    },
    numOfFollowings: {
      type: Number,
      default: 0,
    },
    posts: [{ postId: { type: mongoose.Schema.Types.ObjectId, ref: "Posts" } }],
  },
  { timestamps: true, toJSON: { virtuals: true }, toObject: { virtuals: true } }
);

UserSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

UserSchema.methods.createJWT = function () {
  return jwt.sign(
    {
      userId: this._id,
      email: this.email,
      username: this.username,
      phoneNumber: this.phoneNumber,
      role: this.role,
    },
    process.env.JWT_SECRET,
    {
      expiresIn: process.env.JWT_LIFETIME,
    }
  );
};

UserSchema.methods.comparePassword = async function (canditatePassword) {
  const isMatch = await bcrypt.compare(canditatePassword, this.password);
  return isMatch;
};

module.exports = mongoose.model("User", UserSchema);
