const express = require("express");
const UserRouter = express.Router();
const userController = require("../Controller/userController");
const auth = require("../Middleware/userAuth");
const productController = require("../Controller/productController");
const cartController = require("../Controller/cartController");
const orderController = require("../Controller/orderController");
const walletController = require("../Controller/walletController");
const couponController = require("../Controller/couponController");
const wishlistController = require("../Controller/wishlistController");
const reviewController = require("../Controller/reviewController");
const invoiceController = require("../Controller/invoiceController");

const { fileStorageEngine } = require("../multer/multer");
const multer = require("multer");
const upload = multer({ storage: fileStorageEngine });

// __________user___________________________________
UserRouter.get("/", userController.homePage);
UserRouter.get("/login", auth.isLogout, userController.userLogin);
UserRouter.get("/register", auth.isLogout, userController.userRegister);
UserRouter.post("/login", userController.userisLogin);
UserRouter.post("/register", userController.registerUser);
UserRouter.post("/emailVerified", userController.emailVerified);
UserRouter.get("/resendOTP", auth.isLogout, userController.resendOTP);
UserRouter.get("/profile", auth.isLogin, userController.userProfile);
UserRouter.get("/logout", auth.isLogin, userController.userisLogout);

//_____________________profile____________________________________
UserRouter.get("/profile", auth.isLogin, userController.userProfile);
UserRouter.get("/editProfile", auth.isLogin, userController.editProfile);
UserRouter.post("/updateProfile", auth.isLogin, userController.updateProfile);
UserRouter.post(
  "/editemailUpdate",
  auth.isLogin,
  userController.editemailUpdate
);
UserRouter.get("/changePassword", auth.isLogin, userController.changePassword);
UserRouter.post("/changePassword", auth.isLogin, userController.checkPassword);

// _________________________product__________________________________
UserRouter.get("/aProduct",upload.single("images"),productController.aProductPage);
UserRouter.get("/shop", productController.shop);
UserRouter.get("/modal", productController.modal);
UserRouter.get("/price-wise-sort", productController.priceWiseSort);
UserRouter.get("/char-wise-sort", productController.charWiseSort);
UserRouter.get("/new-arrivals-sort", productController.newArrivalsSort);
UserRouter.get("/top-rated-sort", productController.topRated);
UserRouter.get("/feature-product", productController.featureProduct);
UserRouter.get("/search-sort", productController.searchSort);

//_________________________forgot password___________________________

UserRouter.get("/forgotPassword", userController.forgotPsdPage); //rendering the forgot passrod page
UserRouter.post("/forgotEmailValid", userController.forgotEmailValid); //email cheking forgot password
UserRouter.post("/forgotPsdOTP", userController.forgotPsdOTP); //otp send and chek
UserRouter.get("/forgotresendOTP",auth.isLogout,userController.forgotresendOTP);
UserRouter.post("/updatePassword", userController.updatePassword); //if otp corect update the password

//_________________adress________________________________________
UserRouter.get("/editAddress", auth.isLogin, userController.loadEditAddress); //rendering the editaddrress page
UserRouter.post(
  "/editAddress",
  auth.isLogin,
  userController.updateEditedAddress
); //update a spesific address
UserRouter.post("/addAddress", auth.isLogin, userController.addAddress); //post the adress add adres
UserRouter.post("/deleteAddress", auth.isLogin, userController.deleteAddress); //deleting a specific address

//______________________________________cart______________________________________
UserRouter.get("/cart", auth.isLogin, cartController.loadCart); //renderin the cart
UserRouter.get("/addToCart", auth.isLogin, cartController.addToCart); // adt a product to the cart
UserRouter.post("/test", auth.isLogin, cartController.testAjax); //using ajax incrimet the quntity
UserRouter.post("/testdic", auth.isLogin, cartController.testdic); //using ajx dicriment the quantity
UserRouter.post(
  "/deleteItemeCart",
  auth.isLogin,
  cartController.deleteItemeCart
); //delete a product in the cart
UserRouter.get("/deleteCart", auth.isLogin, cartController.deleteCart); //delete a item in cart
UserRouter.post("/updateCart", auth.isLogin, cartController.updateCart);
UserRouter.get("/getCartCount", auth.isLogin, cartController.cartCount);

//___________________________________oder_____________________________________
UserRouter.get("/selectPaymentMethord", auth.isLogin, orderController.chekOut); //rendering the chekout page
UserRouter.get("/oderPage", auth.isLogin, orderController.oderPage); //rendering the oder page
UserRouter.post("/oderPlaced", auth.isLogin, orderController.oderPlaced); //confrming the order ans selet payment and address
UserRouter.get("/allOderData", auth.isLogin, orderController.allOderData); //user get that spcific oder data
UserRouter.get("/oderDetails", auth.isLogin, orderController.oderDetails); //user vist hisorders details
UserRouter.get("/canselOrder", auth.isLogin, orderController.canselOder); //canselng a orde
UserRouter.post("/verifyPayment", auth.isLogin, orderController.verifyPayment); //
UserRouter.get("/return", auth.isLogin, orderController.returnOrder); //delivered order return
UserRouter.get("/buyNOw", auth.isLogin, orderController.buyNOw); //a single produt buynow
UserRouter.post(
  "/buynowPlaceOrder",
  auth.isLogin,
  orderController.buynowPlaceOrder
);
UserRouter.post("/pending-payment",auth.isLogin, orderController.pendingPayment)

//_____________________wallet_____________________________
UserRouter.get("/sumWallet", auth.isLogin, walletController.sumWallet);
UserRouter.post(
  "/addMoneyWallet",
  auth.isLogin,
  walletController.addMoneyWallet
);
UserRouter.post(
  "/updateMongoWallet",
  auth.isLogin,
  walletController.updateMongoWallet
);
UserRouter.post("/useWallet", auth.isLogin, orderController.useWallet);
UserRouter.get(
  "/sumWalletBuynow",
  auth.isLogin,
  walletController.sumWalletBuynow
);

//_______________________wishlist____________________________
UserRouter.get("/Wishlist", auth.isLogin, wishlistController.Wishlist); //rendering the wishlist
UserRouter.get("/addToList", auth.isLogin, wishlistController.addToList); // add apriduct to the wish list
UserRouter.get(
  "/deleteWishlistItem",
  auth.isLogin,
  wishlistController.deleteWishlistItem
); //delete a item in wish list
UserRouter.get(
  "/getWishlistCount",
  auth.isLogin,
  wishlistController.wishlistCount
);

//___________coupon___________
UserRouter.post(
  "/validateCoupon",
  auth.isLogin,
  couponController.validateCoupon
);

//_______________review___________________
UserRouter.post("/review", auth.isLogin, reviewController.review);

//______________invoice___________________
UserRouter.get("/invoice", auth.isLogin, invoiceController.invoice);
UserRouter.get("/invoices", auth.isLogin, invoiceController.invoices);



module.exports = UserRouter;
