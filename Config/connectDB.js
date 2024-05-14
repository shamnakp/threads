const mongoose = require("mongoose");

const conntectDB = () => {
  try {
    const conn = mongoose.connect(process.env.MONGODB_URI);
    console.log("mongodb connected");
  } catch (error) {
    console.log("error", error);
  }
};

module.exports = conntectDB;
