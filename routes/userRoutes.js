const express = require("express");
const router = express.Router();

const {
  userProfile,
  getAllUsers,
  updateAccount,
  deleteAccount,
  confirmDeleteAccount,
  getSingleUser,
  searchUser,
} = require("../controllers/userController");

const { authenticateUser } = require("../middleware/authentication");

//get user profile
router.get("/display-account", authenticateUser, userProfile);

//search user routes
router.get("/search-user", authenticateUser, searchUser);

//get all users
router.get("/get-all-users", authenticateUser, getAllUsers);

//delete account
router.get("/delete-account", authenticateUser, deleteAccount);

//update account
router.patch("/update-account", authenticateUser, updateAccount);

//confirm delete account
router.delete("/confirm-account", authenticateUser, confirmDeleteAccount);

//get single user route
router.get("/get-single-user/:id", authenticateUser, getSingleUser);

module.exports = router;
