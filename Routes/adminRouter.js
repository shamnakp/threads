let express = require("express");
let AdminRouter = express.Router();
let adminController = require("../Controller/adminController");
let categoryController = require("../Controller/categoryController");
let productController = require("../Controller/productController");
let orderController = require("../Controller/orderController");
let couponController = require("../Controller/couponController");
let offerController = require("../Controller/offerController");
let auth = require("../Middleware/adminAuth");
const { fileStorageEngine } = require("../multer/multer");
const multer = require("multer");

const upload = multer({ storage: fileStorageEngine });

AdminRouter.get("/", auth.isLogout, adminController.adminLogin);
AdminRouter.post("/", auth.isLogout, adminController.adminVerify);
AdminRouter.get("/dashboard", auth.isLogin, adminController.dashboardPage);

AdminRouter.get("/listUser", auth.isLogin, adminController.loadUsersList);
AdminRouter.get("/blockUser", auth.isLogin, adminController.blockUser);
AdminRouter.get("/unblockUser", auth.isLogin, adminController.unBlockUser);

AdminRouter.get("/category", auth.isLogin, categoryController.loadCategory); //rendering category page
AdminRouter.get(
  "/addCategory",
  auth.isLogin,
  categoryController.loadaddCategories
); //ading a new catogory to the data bsae and show it
AdminRouter.post("/addCategory", auth.isLogin, categoryController.addCategory); //ading a new catogory to the data bsae and show it
AdminRouter.get(
  "/deleteCategory",
  auth.isLogin,
  categoryController.deleteCategory
);
AdminRouter.get("/editCategory", auth.isLogin, categoryController.editCategory); //rendering the edit category page with that specific user data
AdminRouter.post("/updateCategory", categoryController.updateCategory); //after rendering the edit category page update the catogory data to db

AdminRouter.get("/product", auth.isLogin, productController.getAllProducts); //load all data and rendering the product page
AdminRouter.get(
  "/product/:page",
  auth.isLogin,
  productController.getAllProducts
);
AdminRouter.get("/addProduct", auth.isLogin, productController.addProduct); //rendering the addproduct page
AdminRouter.post(
  "/createProduct",
  auth.isLogin,
  upload.array("images", 12),
  productController.createProduct
); //creating a new product
AdminRouter.get("/editProduct", auth.isLogin, productController.editProduct); //rendering a spesific proct edit page
AdminRouter.post(
  "/productEdited",
  auth.isLogin,
  upload.array("images", 12),
  productController.productEdited
); //after editing update thta data to db
AdminRouter.get(
  "/unlistProduct",
  auth.isLogin,
  productController.unlistProduct
); // unlisting tht prduct
AdminRouter.get("/listProduct", auth.isLogin, productController.listProduct); // listing tht product
AdminRouter.get("/deleteSingleImage", productController.deleteSingleImage);
AdminRouter.post("/deleteProduct/:id", productController.deleteProduct);

//____________________________order___________________________________
AdminRouter.get("/orderListing", auth.isLogin, orderController.orderListing); //show all the orders to the admin page
AdminRouter.get(
  "/oderDetailsadmin",
  auth.isLogin,
  orderController.oderDetailsAdmin
); //serching the and filtering dt
AdminRouter.get(
  "/changeStatusPending",
  auth.isLogin,
  orderController.changeStatusPending
);
AdminRouter.get(
  "/changeStatusConfirmed",
  auth.isLogin,
  orderController.changeStatusConfirmed
);
AdminRouter.get(
  "/changeStatusShipped",
  auth.isLogin,
  orderController.changeStatusShipped
);
AdminRouter.get(
  "/changeStatusDelivered",
  auth.isLogin,
  orderController.changeStatusDelivered
);
AdminRouter.get(
  "/changeStatusreturned",
  auth.isLogin,
  orderController.changeStatusreturned
);
AdminRouter.get(
  "/changeStatusCanseled",
  auth.isLogin,
  orderController.changeStatusCanseled
);

//___________________________________________________________________

//_____________________coupen__________________________________
AdminRouter.get("/addCoupon", auth.isLogin, couponController.loadCoupon);
AdminRouter.post("/addCoupon", auth.isLogin, couponController.addCoupon);
AdminRouter.get("/coupon", auth.isLogin, couponController.coupon);
AdminRouter.get("/deleteCoupon", auth.isLogin, couponController.deleteCoupon);
AdminRouter.post("/updateCoupon", auth.isLogin, couponController.updateCoupon);
AdminRouter.get("/editCoupon", auth.isLogin, couponController.editCoupon);
// ________________________________________________________________

//___________________offer_____________________________
AdminRouter.get(
  "/productOfferpage",
  auth.isLogin,
  offerController.productOfferpage
);
AdminRouter.post("/updateOffer", auth.isLogin, offerController.updateOffer);
AdminRouter.get("/categoryOffer", auth.isLogin, offerController.categoryOffer);
AdminRouter.post(
  "/updateCategoryOffer",
  auth.isLogin,
  offerController.updateCategoryOffer
);
// ___________________________________________________

// __________________Sales Report________________________
AdminRouter.get(
  "/loadsalesReport",
  auth.isLogin,
  orderController.loadSalesReport
);
AdminRouter.get("/filter-sales", auth.isLogin, orderController.filterSales);
AdminRouter.post(
  "/datewise-filter-sales",
  auth.isLogin,
  orderController.dateWiseSales
);
AdminRouter.post(
  "/generate-pdf",
  auth.isLogin,
  orderController.generateSalesPdf
);
AdminRouter.post(
  "/generate-csv",
  auth.isLogin,
  orderController.generateSalesCsv
);

// ________________________________________________________

AdminRouter.get("/logout", auth.isLogin, adminController.logoutAdmin);

module.exports = AdminRouter;
