const express = require("express");
const bodyParser = require("body-parser");
const path = require("path");
const cookieParser = require("cookie-parser");
const connectDB = require("./Config/connectDB");
const app = express();
const dotenv = require("dotenv").config();
const PORT = process.env.PORT || 4000;
const UserRouter = require("./Routes/userRouter");
const AdminRouter = require("./Routes/adminRouter");
const session = require("express-session");
const mongodbSession = require("connect-mongodb-session")(session);
const loadCategories = require("./Middleware/loadCategories");
const store = new mongodbSession({
  uri: process.env.MONGO_URL,
  collection: "SessionDB",
});

connectDB();

app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static("public"));
app.use(express.static(path.join(__dirname, "public/user/user-assets")));
app.use(express.static(path.join(__dirname, "public/admin/admin-assets")));

app.use(
  session({
    secret: process.env.SESSION_SECRET_KEY,
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 72 * 60 * 60 * 1000, // Session expires in 72 hours
      httpOnly: true,
    },
    store: store,
  })
);

app.set("view engine", "ejs");
app.set("views", [
  path.join(__dirname, "views", "admin"),
  path.join(__dirname, "views", "user"),
]);

app.use(loadCategories);

// Middleware to fetch categories

app.use("/api", UserRouter);
app.use("/api/admin", AdminRouter);

app.listen(PORT, () => {
  console.log(`port is number running ${PORT} http://localhost:${PORT}/api`);
});
