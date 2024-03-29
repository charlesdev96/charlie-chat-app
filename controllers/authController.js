const User = require("../models/User");
const { StatusCodes } = require("http-status-codes");

// Function to validate email format using regex
const isEmailValid = (email) => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

const register = async (req, res) => {
  try {
    const { username, email, phoneNumber, password, confirmPassword, role } =
      req.body;
    if (!username || !email || !phoneNumber || !password || !confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "please provide all values" });
    }

    // Check if email is valid
    if (!isEmailValid(email)) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Please provide a valid email address" });
    }

    //check if password and confrimPassword match
    if (password !== confirmPassword) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Passwords do not match." });
    }

    // check for existing user
    const existingUserName = await User.findOne({ username });
    const existingEmail = await User.findOne({ email });
    const existingPhoneNumber = await User.findOne({ phoneNumber });
    if (existingEmail || existingUserName || existingPhoneNumber) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "User already exist" });
    }

    //create new user
    const newUser = await User.create(req.body);
    const user = await User.findOne({ email }).select("-password");
    const token = newUser.createJWT();
    res.status(StatusCodes.CREATED).json({
      status: true,
      message: "User has been registered successfully",
      data: user,
      token,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error,
      message: "Error Occurred Registering User",
    });
    console.log(error);
  }
};

const login = async (req, res) => {
  try {
    // const { username, email, password } = req.body;
    if ((!req.body.email && !req.body.username) || !req.body.password) {
      return res
        .status(StatusCodes.BAD_REQUEST)
        .json({ error: "Please provide username or email and password" });
    }

    // Find user by email or username
    let user;
    if (req.body.email) {
      user = await User.findOne({ email: req.body.email });
    } else {
      user = await User.findOne({ username: req.body.username });
    }

    //check if user exist using email or username
    if (!user) {
      return res.status(StatusCodes.BAD_REQUEST).json({
        error:
          "Invalid username/email or password. Please check your credentials and try again.",
      });
    }

    //check if password is correct
    const isPasswordCorrect = await user.comparePassword(req.body.password);
    if (!isPasswordCorrect) {
      return res.status(StatusCodes.UNAUTHORIZED).json({
        error:
          "Invalid username/email or password. Please check your credentials and try again.",
      });
    }
    const token = user.createJWT();
    const name = user.username;
    const { password, followers, followings, posts, ...data } = user._doc;
    res.status(StatusCodes.OK).json({
      status: true,
      message: `Hey ${name}, good to see you again!`,
      data: data,
      token,
    });
  } catch (error) {
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
      error: error,
      message: "Error Occurred logging in the User",
    });
    console.log(error);
  }
};

module.exports = {
  register,
  login,
};
