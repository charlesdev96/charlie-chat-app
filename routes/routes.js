const express = require("express");
const router = express.Router();

//auth routers
const authRouter = require("./authRoutes");

//file upload routers
const fileUpload = require("./fileRoutes");

//user routers
const userRouter = require("./userRoutes");

//post router
const postRouter = require("./postRoutes");

//user followings routes
const userFollowingsRoutes = require("./followRoutes");

//comment routes
const commentRouter = require("./commentRoutes");

//message router
const messageRouter = require("./messageRoutes");

const baseURL = "/api/v1";

router.use(`${baseURL}/auth`, authRouter);
router.use(`${baseURL}`, fileUpload);
router.use(`${baseURL}/user`, userRouter);
router.use(`${baseURL}/user`, userFollowingsRoutes);
router.use(`${baseURL}/post`, postRouter);
router.use(`${baseURL}/comment`, commentRouter);
router.use(`${baseURL}/message`, messageRouter);

module.exports = router;
