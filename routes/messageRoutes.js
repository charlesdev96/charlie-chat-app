const express = require("express");
const router = express.Router();

const {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
} = require("../controllers/messageController");

const { authenticateUser } = require("../middleware/authentication");

//send message router
router.post("/send-message/:id", authenticateUser, sendMessage);

//get message router
router.get("/get-message/:id", authenticateUser, getMessages);

//edit message router
router.patch("/edit-message/:id", authenticateUser, editMessage);

//delete message
router.delete("/delete-message/:id", authenticateUser, deleteMessage);

module.exports = router;
