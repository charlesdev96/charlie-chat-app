require("dotenv").config();
const jwt = require("jsonwebtoken");
const { StatusCodes } = require("http-status-codes");

const authenticateUser = async (req, res, next) => {
  // check header
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith("Bearer")) {
    return res
      .status(StatusCodes.FORBIDDEN)
      .json({ error: "Sorry, you must be logged in to access this route" });
  }
  const token = authHeader.split(" ")[1];

  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET);
    // attach the user to the job routes
    req.user = {
      userId: payload.userId,
      username: payload.username,
      phoneNumber: payload.phoneNumber,
      role: payload.role,
      email: payload.email,
    };
    next();
  } catch (error) {
    res
      .status(StatusCodes.UNAUTHORIZED)
      .json({ error: "Authentication Invalid" });
  }
};

const authorizePermissions = (...roles) => {
  return (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res
        .status(StatusCodes.UNAUTHORIZED)
        .json({ error: "Unauthorized to access this route" });
    }
    next();
  };
};

module.exports = {
  authenticateUser,
  authorizePermissions,
};
