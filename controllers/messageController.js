const User = require("../models/User");
const Message = require("../models/Message");
const Conversation = require("../models/Conversation");
const { StatusCodes } = require("http-status-codes");
const { io, getReceiverSocketId } = require("../sockets/socket");

const sendMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.user.userId;
    const receiverId = req.params.id;

    //check if users have chatted before
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    //if no conversations between them, create a new conversation
    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }
    //send the message
    const newMessage = new Message({
      senderId,
      receiverId,
      message,
    });

    //push the new message _id to conversation
    if (newMessage) {
      conversation.messages.push(newMessage._id);
    }
    // save the conversation and message
    await Promise.all([conversation.save(), newMessage.save()]);

    //socket.io function
    const receiverSocketId = getReceiverSocketId(receiverId);
    if (receiverSocketId) {
      // io.to(<socket_id>).emit() used to send events to specific client
      io.to(receiverSocketId).emit("newMessage", newMessage);
    }
    res.status(StatusCodes.CREATED).json({
      success: true,
      message: "Your message has been sent.",
      data: newMessage,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to send message",
      error: error,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const receiverId = req.params.id;

    //find their conversations
    const conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    }).populate({
      path: "messages",
      select: "senderId receiverId message createdAt updatedAt",
    });
    if (!conversation) {
      return res.status(StatusCodes.OK).json({
        success: true,
        message:
          "Your chat history is currently empty. Click the 'New Chat' button to get started!",
        data: [],
      });
    }
    const messages = conversation.messages;
    res.status(StatusCodes.OK).json(messages);
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to retrieve messages",
      error: error,
    });
  }
};

const editMessage = async (req, res) => {
  try {
    const { message } = req.body;
    const senderId = req.user.userId;
    const messageId = req.params.id;
    const chat = await Message.findOne({ _id: messageId });
    if (!chat) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Message not found" });
    }

    //check if chat belongs to user
    if (chat.senderId.toString() !== senderId.toString()) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Oops! You can only edit messages that you sent yourself.",
      });
    }
    chat.message = message;
    await chat.save();

    res.status(StatusCodes.OK).json({
      success: true,
      message:
        "Your message has been updated and the changes are now reflected in the chat.",
      data: message,
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to edit message",
      error: error,
    });
  }
};

const deleteMessage = async (req, res) => {
  try {
    const senderId = req.user.userId;
    const messageId = req.params.id;
    //find message
    const chat = await Message.findOne({ _id: messageId });
    // Find the conversation that contains the message
    const conversation = await Conversation.findOne({ messages: messageId });
    if (!conversation) {
      return res.status(404).json({ message: "Conversation not found" });
    }

    if (!chat) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Message not found" });
    }
    //check if chat belongs to user
    if (chat.senderId.toString() !== senderId.toString()) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error: "Oops! You can only delete messages that you sent yourself.",
      });
    }
    // Remove the messageId from the messages array in the Conversation model
    conversation.messages.pull(messageId);

    //proceed to delete message and save the updated conversation
    await Promise.all([conversation.save(), chat.deleteOne()]);
    res.status(StatusCodes.OK).json({
      success: true,
      message:
        "Your message has been deleted successfully. It will no longer be visible in the conversation.",
    });
  } catch (error) {
    console.error(error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      success: false,
      message: "Unable to delete message",
      error: error,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  editMessage,
  deleteMessage,
};
