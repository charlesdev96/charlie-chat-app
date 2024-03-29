require("dotenv").config();
require("express-async-errors");
const express = require("express");
const app = express();

const helmet = require("helmet");
const cors = require("cors");
const morgan = require("morgan");
const connectDB = require("./db/connect");
const routes = require("./routes/routes");
const notFoundMiddleware = require("./middleware/not-found");
const expressFileUpload = require("express-fileupload");

app.use(helmet());
app.use(morgan("common"));
app.use(cors());
app.use(express.json());
app.use(expressFileUpload({ useTempFiles: true, createParentPath: true }));
app.use(routes);
app.use(notFoundMiddleware);

const port = 5000;

const start = async () => {
  await connectDB();
  app.listen(port, () => {
    console.log(`Server running on port ${port}...`);
  });
};

start();
