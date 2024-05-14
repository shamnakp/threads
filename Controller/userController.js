const User = require("../Models/userModel");
const nodemailer = require("nodemailer");
const bcrypt = require("bcrypt");
const Order = require("../Models/orderModel");
const Product = require("../Models/productModel");
const Category = require("../Models/categoryModel");
const {
  Types: { ObjectId },
} = require("mongoose");

// login page______________

const userLogin = async (req, res) => {
  try {
    res.render("userLogin");
  } catch (error) {
    console.log(error);
  }
};

// _____________________________

// home page_______________________

const homePage = async (req, res) => {
  try {
    const user = req.session.user;
    if (user) {
      const catogary = await Category.find();
      const userdata = await User.findById(user);
      const product = await Product.find().sort({ _id: -1 }).limit(9);
      // const banner= await Banner.find()
      const pr = product.status == true;
      req.session.Product = product;
      // const blog= await Blog.find()
      res.render("homePage", { user: userdata, product, catogary });
    } else {
      const catogary = await Category.find();
      const product = await Product.find().limit(9);
      // const banner= await Banner.find()
      const pr = product.status == true;
      req.session.Product = product;
      // const blog= await Blog.find()
      res.render("homePage", { user, product, catogary });
    }
  } catch (error) {
    console.log(error);
  }
};

// register page________________________

const userRegister = async (req, res) => {
  try {
    res.render("userRegister");
  } catch (error) {
    console.log(error);
  }
};

// ________________________________________

// generate otp __________________________

function generateotp() {
  const otpLength = 6;
  const otp = Math.random()
    .toString()
    .slice(2, 2 + otpLength);

  return otp;
}

// _______________________________________

// ___________________________________

const registerUser = async (req, res) => {
  try {
    const { email } = req.body;
    const { mobile } = req.body;
    const findEmail = await User.findOne({ email });
    const findMobile = await User.findOne({ mobile });
    if (findEmail && findMobile) {
      res.render("userRegister", {
        error: "Email and Mobile already exists. Try again",
      });
    } else if (findEmail) {
      res.render("userRegister", { error: "Email already exists. Try again" });
    } else if (findMobile) {
      res.render("userRegister", { error: "Mobile already exists. Try again" });
    } else {
      const otp = generateotp();
      const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.AUTH_EMAIL,
          pass: process.env.AUTH_PASS,
        },
      });
      const info = await transporter.sendMail({
        from: process.env.AUTH_EMAIL, // sender address
        to: email, // list of receivers
        subject: "Verify Your Account  ✔", // Subject line
        text: `Your OTP is : ${otp}`, // plain text body
        html: `<b>  <h4 >Your OTP  ${otp}</h4>    <br>  <a href="/api/emailOtp/">Click here</a></b>`, // html body
      });
      if (info) {
        req.session.userOTP = otp;
        req.session.userData = req.body;
        // res.render("emailOtp",{email:email});
        res.render("emailOtp", { message: "", email: email });
        console.log("Message sent: %s", info.messageId);
      } else {
        res.json("email eroor");
      }
    }
  } catch (error) {
    console.log(
      "Error hapents in userControler registeruser function : now",
      error
    );
  }
};

// _________________________________________

// user otp enter cheking if its true render home else error mesage____

const emailVerified = async (req, res) => {
  try {
    const { first, second, third, fourth, fifth, six } = req.body;
    const enteredOTP = first + second + third + fourth + fifth + six;
    console.log(enteredOTP);
    if (enteredOTP === req.session.userOTP) {
      const user = req.session.userData;

      const hashedPassword = await user.password;
      const saveUserData = new User({
        username: user.username,
        email: user.email,
        mobile: user.mobile,
        password: hashedPassword,
      });

      await saveUserData.save();

      req.session.user = saveUserData._id;
      req.session.save();

      res.redirect("/api");
    } else {
      // res.render("emailOtp",{message:"Invalid OTP Re-enter Correct OTP"})
      res.render("emailOtp", { message: "Invalid OTP Re-enter Correct OTP" });
    }
  } catch (error) {
    console.log(
      "Error hapents in userControler emaiVerified  function :",
      error
    );
  }
};

// ___________________________________

// Resent otp_________________________

const resendOTP = async (req, res) => {
  try {
    const { email } = req.query;
    const otp = generateotp();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.AUTH_EMAIL, // sender address
      to: email, // list of receivers
      subject: "Verify Your Account  ✔", // Subject line
      text: `Your OTP is : ${otp}`, // plain text body
      html: `<b>  <h4 >Your OTP  ${otp}</h4>    <br>  <a href="/api/emailOtp/">Click here</a></b>`, // html body
    });
    if (info) {
      req.session.userOTP = otp;
      // res.render("emailOtp",{email:email});
      res.render("emailOtp", { message: "", email: email });
      console.log("Message sent: %s", info.messageId);
    } else {
      res.json("email eroor");
    }
  } catch (error) {
    console.log(error);
  }
};

// ______________________________________

//user login_________________________________

const userisLogin = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findUser = await User.findOne({ email });
    if (findUser && (await findUser.isPasswordMatched(password))) {
      if (findUser.is_blocked !== true) {
        req.session.user = findUser._id;
        req.session.save();
        res.redirect("/api");
      } else {
        res.render("userLogin", { message: "your blocked admin" });
      }
    } else {
      console.log("error in login userr");
      res.render("userLogin", { message: "invalid credential" });
    }
  } catch (error) {
    console.log("Error hapents in userControler userLogin function :", error);
  }
};

// ________________________________________________________________

//user logout____________________________________________________

const userisLogout = async (req, res) => {
  try {
    req.session.destroy();

    res.redirect("/api");
  } catch (error) {
    console.log("Error happens in userControler userLogout function:", error);
  }
};
//______________________________________________________________

// ______________________forgot password_____________________________

//rendering the forgote assword page______________________
const forgotPsdPage = async (req, res) => {
  try {
    res.render("forgotPassword");
  } catch (error) {
    console.log(
      "Error hapents in userControler forgotPsdPage  function :",
      error
    );
  }
};
//___________________________________________________________________

//chech the email is valid and send an email to it___________________
const forgotEmailValid = async (req, res) => {
  try {
    const { email } = req.body;
    const findUser = await User.findOne({ email });
    if (findUser) {
      const otp = generateotp();
      const transporter = nodemailer.createTransport({
        service: "gmail",
        port: 587,
        secure: false,
        requireTLS: true,
        auth: {
          user: process.env.AUTH_EMAIL,
          pass: process.env.AUTH_PASS,
        },
      });
      const info = await transporter.sendMail({
        from: process.env.AUTH_EMAIL,
        to: email,
        subject: "Verify Your Account  ✔",
        text: `Your OTP is : ${otp}`,
        html: `<b>  <h4 >Your OTP  ${otp}</h4>    <br>  <a href="/api/emailOTP/">Click here</a></b>`,
      });
      if (info) {
        req.session.forgotOTP = otp;
        req.session.forgotEmail = req.body.email;
        res.render("forgotPsdOTP", { message: "", email: email });
        console.log("Message sent: %s", info.messageId);
      } else {
        res.json("email error");
      }
    } else {
      req.flash("error", "User not found");
      res.redirect("/api/forgotPassword");
    }
  } catch (error) {
    console.log(
      "Error happens in userControler forgotEmailValid function:",
      error
    );
  }
};
//______________________________________________________________________

//cheking the re entedred email is aledy exist if exist chek otp is valid____________-

const forgotPsdOTP = async (req, res) => {
  try {
    const { first, second, third, fourth, fifth, six } = req.body;
    const enteredOTP = first + second + third + fourth + fifth + six;
    console.log("otp entered by user :", enteredOTP);
    if (enteredOTP === req.session.forgotOTP) {
      res.render("resetPassword");
    } else {
      res.render("forgotPsdOTP", {
        message: "Invalid OTP Re-enter Correct OTP",
      });
    }
  } catch (error) {
    console.log(
      "Error hapents in userControler forgotPsdOTP  function :",
      error
    );
  }
};
//______________________________________________________

// Resent otp_________________________

const forgotresendOTP = async (req, res) => {
  try {
    const { email } = req.query;
    const otp = generateotp();
    const transporter = nodemailer.createTransport({
      service: "gmail",
      port: 587,
      secure: false,
      requireTLS: true,
      auth: {
        user: process.env.AUTH_EMAIL,
        pass: process.env.AUTH_PASS,
      },
    });
    const info = await transporter.sendMail({
      from: process.env.AUTH_EMAIL,
      to: email,
      subject: "Verify Your Account  ✔",
      text: `Your OTP is : ${otp}`,
      html: `<b>  <h4 >Your OTP  ${otp}</h4>    <br>  <a href="/api/emailOTP/">Click here</a></b>`,
    });
    if (info) {
      req.session.forgotOTP = otp;
      res.render("forgotPsdOTP", { message: "", email: email });
      console.log("Message sent: %s", info.messageId);
    } else {
      res.json("email error");
    }
  } catch (error) {
    console.log(error);
  }
};

// ______________________________________

//updating password__________________

const updatePassword = async (req, res) => {
  try {
    const email = req.session.forgotEmail;
    const user = await User.findOne({ email });

    if (user) {
      const newPassword = req.body.password;
      user.password = newPassword;
      const updateUser = await user.save();
      delete req.session.forgotEmail;
      res.redirect("/api/login");
    } else {
      res.status(404).send("User not found");
    }
  } catch (error) {
    console.log(
      "Error happens in userController updatePassword function:",
      error
    );
    res.status(500).send("Internal Server Error");
  }
};

// _______________________________________________

// ______________________profile_________________________

// profile______________________________________________________

const userProfile = async (req, res) => {
  try {
    const id = req.session.user;
    const user = await User.findById(id);
    const order = await Order.find({ userId: id }).sort({ date: -1 });

    // console.log('this is the orders od user',);
    res.render("profilePage", { user, order, req: req });
  } catch (error) {
    console.log(
      "Error hapents in userControler profilePage  function :",
      error
    );
  }
};

// _______________________________________________________________

//editProfile______________________________________________________

const editProfile = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await User.findById(id);
    console.log("user is ", user);
    res.render("editProfile", { user });
  } catch (error) {
    console.log("Error hapents in userControler editProfile function:", error);
  }
};

// _______________________________________________________________

// updateProfile_________________________________________________

const updateProfile = async (req, res) => {
  try {
    const { id, username, email, mobile } = req.body;

    const user = await User.findByIdAndUpdate(id);

    //cheking that anything aleary exist--
    const alreadyExist = await User.find({
      $and: [
        { _id: { $ne: user._id } }, // not equal to the current user
        { $or: [{ username }, { email }] }, // Check for the same username or email
      ],
    });

    if (alreadyExist.length == 0) {
      if (user.email === email) {
        user.username = username;
        user.email = email;
        user.mobile = mobile;
        const updatedUser = await user.save();
      } else {
        const otp = generateotp();
        const transporter = nodemailer.createTransport({
          service: "gmail",
          port: 587,
          secure: false,
          requireTLS: true,
          auth: {
            user: process.env.AUTH_EMAIL,
            pass: process.env.AUTH_PASS,
          },
        });
        const info = await transporter.sendMail({
          from: process.env.AUTH_EMAIL, // sender address
          to: email, // list of receivers
          subject: "Verify Your Account  ✔", // Subject line
          text: `Your OTP is : ${otp}`, // plain text body
          html: `<b>  <h4 >Your OTP  ${otp}</h4>    <br>  <a href="/api/emailOtp/">Click here</a></b>`, // html body
        });
        if (info) {
          req.session.userOTP = otp;
          req.session.userData = req.body;
          // res.render("emailOtp",{email:email});
          res.render("editemailOtp", { message: "", email: email });
          console.log("Message sent: %s", info.messageId);
        } else {
          res.json("email eroor");
        }
      }
      res.redirect("/api/profile");
    } else {
      console.log("user is alredy exist ");
    }
  } catch (error) {
    console.log(
      "Error hapents in userControler updateProfile function:",
      error
    );
  }
};

// _______________________________________________________________

const editemailUpdate = async (req, res) => {
  try {
    const { first, second, third, fourth, fifth, six } = req.body;
    const enteredOTP = first + second + third + fourth + fifth + six;
    // const user
    console.log("currently :", req.session.userData);
    const { id, username, email, mobile } = req.session.user;
    const userId = new ObjectId(id);
    const user = await User.findByIdAndUpdate(userId, {
      username,
      email,
      mobile,
    });

    if (enteredOTP == req.session.userOTP) {
      const { username, mobile, email } = req.session.userData;
      user.username = username;
      user.email = email;
      user.mobile = mobile;
      const updatedUser = await user.save();
    }
    res.redirect("/api/profile");
  } catch (error) {
    console.log("error happent user ctrl editemailupdate error:", error);
  }
};

// changePassword__________________________________________________

const changePassword = async (req, res) => {
  try {
    const id = req.query.id;
    const user = await User.findById(id);
    console.log("user is ", user);
    res.render("changePassword", { user });
  } catch (error) {
    console.log(
      "Error hapents in userControler reset change password function:",
      error
    );
  }
};

// checkPassword_________________________________________________

const checkPassword = async (req, res) => {
  try {
    const { currentPassword, password } = req.body;

    // console.log('User current password :',currentPassword);
    // console.log('User new Password',password);

    const user_id = req.session.user._id;
    const user = await User.findById(user_id);

    const isMatch = await user.isPasswordMatched(currentPassword);
    if (isMatch) {
      user.password = password;
      await user.save();
      res.redirect("/api/profile");
      res.json({ status: "success", message: "Password changed" });
    } else {
      res.json({ status: "error", message: "Current Password is Incorrect" });
    }
  } catch (error) {
    console.log(
      "Error hapents in userControler reset check password function:",
      error.message
    );
  }
};

// _______________________________________________________________

// _______________________________________________________________

//addAddress____________________________________________--

const addAddress = async (req, res) => {
  try {
    const {
      fullName,
      mobile,
      pinCode,
      addressLine,
      areaStreet,
      ladmark,
      townCity,
      state,
      addressType,
    } = req.body;
    const id = req.session.user;
    const user = await User.findById(id);
    const newAddress = {
      fullName,
      mobile,
      pinCode,
      addressLine,
      areaStreet,
      ladmark,
      townCity,
      state,
      addressType,
      main: false,
    };
    if (user.address.length === 0) {
      newAddress.main = true;
    }
    user.address.push(newAddress);
    await user.save();
    console.log("Address added to user:", user);
    res.redirect("/api/profile");
  } catch (error) {
    console.log("Error happens in userControler addAddress function:", error);
  }
};

// _______________________________________________________________

//loadEditAddress__________________________________

const loadEditAddress = async (req, res) => {
  try {
    const id = req.query.id;
    const userId = req.session.user;
    const user = await User.findById(userId);
    const address = user.address.id(id);
    res.render("editAddress", { user, address });
  } catch (error) {
    console.log(
      "Error hapents in userControler loadEditAdress function:",
      error
    );
  }
};

// _______________________________________________________________

//updateEditedAddress__________________________________________

const updateEditedAddress = async (req, res) => {
  try {
    const userId = req.session.user;
    const {
      fullName,
      mobile,
      pinCode,
      addressLine,
      areaStreet,
      ladmark,
      townCity,
      state,
      adressType,
      id,
    } = req.body;
    const user = await User.findById(userId);
    if (user) {
      const updatedAddress = user.address.id(id);
      console.log(updatedAddress);
      if (updatedAddress) {
        updatedAddress.fullName = fullName;
        updatedAddress.mobile = mobile;
        updatedAddress.pinCode = pinCode;
        updatedAddress.addressLine = addressLine;
        updatedAddress.areaStreet = areaStreet;
        updatedAddress.ladmark = ladmark;
        updatedAddress.townCity = townCity;
        updatedAddress.state = state;
        updatedAddress.adressType = adressType;
        await user.save();

        res.redirect("/api/profile");
      } else {
        console.log("adress not found ");
      }
    }
  } catch (error) {
    console.log(
      "Error hapents in userControler updateEditedAddress function:",
      error
    );
  }
};

// _______________________________________________________________

//deleteAddress______________________________________________

const deleteAddress = async (req, res) => {
  try {
    const id = req.body.productId;
    const userId = req.session.user;
    const user = await User.findOne({ _id: userId });
    const le = user.address.lenght;
    console.log(le);
    if (userId.address.length > 1) {
      const deleteAdd = await User.findOneAndUpdate(
        { _id: userId },
        {
          $pull: { address: { _id: id } },
        },
        { new: true }
      );

      res.json({ status: "success" });
    } else {
      res.json({ status: "error" });
    }
  } catch (error) {
    console.log(
      "Error hapents in userControler udeletedAddress function:",
      error
    );
  }
};

// _______________________________________________________________

module.exports = {
  userLogin,
  homePage,
  userRegister,
  registerUser,
  resendOTP,
  userisLogin,
  userisLogout,
  emailVerified,
  forgotPsdPage,
  forgotEmailValid,
  forgotPsdOTP,
  updatePassword,
  userProfile,
  forgotresendOTP,
  addAddress,
  loadEditAddress,
  updateEditedAddress,
  deleteAddress,
  editProfile,
  updateProfile,
  changePassword,
  checkPassword,
  editemailUpdate,
};
