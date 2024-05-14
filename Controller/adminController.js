const User = require("../Models/userModel");
const Oder = require("../Models/orderModel");
const Product = require("../Models/productModel");
const Category = require("../Models/categoryModel");
//admin login

const adminLogin = async (req, res) => {
  try {
    res.render("adminLogin");
  } catch (error) {
    console.log(error);
  }
};

//admin verification

const adminVerify = async (req, res) => {
  try {
    const { email, password } = req.body;
    const findAdmin = await User.findOne({ email });

    if (findAdmin) {
      const isMatch = await findAdmin.isPasswordMatched(password);
      if (isMatch && findAdmin.is_admin === true) {
        req.session.Admin = true;
        res.redirect("/api/admin/dashboard");
      } else {
        res.redirect("/api/admin");
      }
    } else {
      // Render the admin login page with an error message
      res.render("admin_login", { invalid: true }); // Assuming your admin login page is named 'admin_login.ejs'
    }
  } catch (error) {
    console.log(error);
    res.status(500).send("Internal Server Error");
  }
};

//load dashboard

const dashboardPage = async (req, res) => {
  try {
    const products = await Product.find();
    const orders = await Oder.find({ status: "delivered" });
    const category = await Category.find();
    const users = await User.find();

    const latestOrders = await Oder.find().sort({ createdOn: -1 }).limit(5);

    const productCount = products.length;
    const orderCount = orders.length;
    const categoryCount = category.length;
    const categoryName = category.map(category => category.name);

    const totalRevenue = orders.reduce(
      (total, order) => total + order.totalPrice,
      0
    );

    const totalRegularPrice = orders.reduce((total, order) => {
      // Iterate over each product in the order and accumulate their regular prices
      const orderRegularPrice = order.product.reduce((orderTotal, product) => {
        // Ensure regularPrice and quantity are valid numbers
        const regularPrice =
          typeof product.regularPrice === "number" ? product.regularPrice : 0;
        const quantity =
          typeof product.quantity === "number" ? product.quantity : 0;
        return orderTotal + regularPrice * quantity;
      }, 0);

      // Add the regular price of the current order to the total
      return total + orderRegularPrice;
    }, 0);

    const totalDiscount = Math.round(totalRegularPrice - totalRevenue);

    //-------------------this is for the sales graph -----
    const monthlySales = await Oder.aggregate([
      {
        $match: {
          status: "delivered", // Filter by status
        },
      },
      {
        $group: {
          _id: {
            $month: "$createdOn",
          },
          count: { $sum: 1 },
        },
      },
      {
        $sort: {
          _id: 1,
        },
      },
    ]);
    const monthlySalesArray = Array.from({ length: 12 }, (_, index) => {
      const monthData = monthlySales.find((item) => item._id === index + 1);
      return monthData ? monthData.count : 0;
    });

    //-------------------this is for the sales graph -end ----

    ///----------this is for the product data------
    const productsPerMonth = Array(12).fill(0);

    // Iterate through each product
    products.forEach((product) => {
      // Extract month from the createdAt timestamp
      const creationMonth = product.createdAt.getMonth(); // JavaScript months are 0-indexed

      // Increment the count for the corresponding month
      productsPerMonth[creationMonth]++;
    });
    ///----------this is for the product data--end----

    console.log(categoryCount,"this is count");
    console.log(categoryName,"this is name");

    const bestSellingPro = await Oder.aggregate([
      { $unwind: "$product" },
      {
        $group: {
          _id: "$product.ProductId",
          totalQuantity: { $sum: "$product.quantity" },
          productName: { $first: "$product.title" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 }
    ]);

    if (bestSellingPro.length > 0) {
      // Return the best-selling product details
      bestSellingPro[0];
    } else {
       null; // No orders or products found
    }




    const bestSellingCat = await Oder.aggregate([
      { $unwind: "$product" },
      {
        $lookup: {
          from: "products", // Assuming there's a collection named "products"
          localField: "product.ProductId",
          foreignField: "_id",
          as: "productDetails"
        }
      },
      { $unwind: "$productDetails" },
      {
        $lookup: {
          from: "catogaries", // Assuming there's a collection named "categories"
          localField: "productDetails.category",
          foreignField: "_id",
          as: "categoryDetails"
        }
      },
      { $unwind: "$categoryDetails" },
      {
        $group: {
          _id: "$productDetails.category",
          categoryName: { $first: "$categoryDetails.name" }, // Include category name
          totalQuantity: { $sum: "$product.quantity" }
        }
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 10 } // Only getting the top-selling category
    ]);


const bestSellingBra = await Oder.aggregate([
  { $unwind: "$product" },
  {
    $lookup: {
      from: "products", // Assuming there's a collection named "products"
      localField: "product.ProductId",
      foreignField: "_id",
      as: "productDetails"
    }
  },
  { $unwind: "$productDetails" },
  {
    $group: {
      _id: "$productDetails.brand", // Grouping by brand
      totalQuantity: { $sum: "$product.quantity" }
    }
  },
  { $sort: { totalQuantity: -1 } },
  { $limit: 10 } // Only getting the top-selling brand
]);





    res.render("dashboard", {
      totalRevenue,
      orderCount,
      productCount,
      categoryCount,
      monthlySalesArray,
      productsPerMonth,
      latestOrders,
      totalDiscount,
      categoryName,
      bestSellingPro,
      bestSellingCat,
      bestSellingBra
    });
  } catch (error) {
    console.log(
      "Error happened in admin controller at adminLoginPage function ",
      error
    );
  }
};

//Load users list page

const loadUsersList = async (req, res) => {
  try {
    const usersData = await User.find({ is_admin: false });
    if (usersData) {
      res.render("listUser", { users: usersData });
    }
  } catch (error) {
    console.log(error.message);
  }
};

//  // Load edit Users

//  const loadEditUsers = async(req,res)=>{
//     try {
//        const id = req.query.id
//        const userData = await User.findById(id);
//        if(userData){
//           res.render('editUser',{user:userData});
//        }
//     } catch (error) {
//        console.log(error.message)
//     }
//  }
//  // Edit users

//  const editUsers = async(req,res)=>{
//     try {
//        const {username,id}= req.body;
//        if(!username){
//           res.json({status:'error',message:'name is required'});
//        }
//        else{
//           const usersData = await User.findByIdAndUpdate(id,
//              {$set:{
//                 username:username
//              }})
//              res.json({status:'success',message:'Successfully Updated'})
//        }
//     } catch (error) {
//        console.log(error.message);
//        res.json({status:'error',message:'Server side issue'});
//     }
//  }

// Block user

const blockUser = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id, "user id in bloked user");

    const blokedUser = await User.findByIdAndUpdate(
      id,
      {
        is_blocked: true,
      },
      { new: true }
    );

    if (blokedUser) {
      // req.session.userBloked = true;
      // req.session.isBlocked = true;

      res.redirect("/api/admin/listUser");
    }
  } catch (error) {
    console.log(
      "Error happens in admin controller at blokeUser function",
      error
    );
  }
};

//unblock user

const unBlockUser = async (req, res) => {
  try {
    const id = req.query.id;
    console.log(id, "user id in unbloked user");

    const unBlokedUser = await User.findByIdAndUpdate(
      id,
      {
        is_blocked: false,
      },
      { new: true }
    );

    if (unBlokedUser) {
      req.session.userBloked = false;
      req.session.blockedMessage = "User is unblocked by admin.";
      console.log("User is unblocked by admin", unBlokedUser);
      res.redirect("/api/admin/listUser");
    }
  } catch (error) {
    console.log(
      "Error happens in admin controller at unBlokeUser function",
      error
    );
  }
};

const logoutAdmin = async (req, res) => {
  try {
    req.session.Admin = null;
    res.redirect("/api/admin");
  } catch (error) {
    console.log(error.message);
  }
};

module.exports = {
  adminLogin,
  adminVerify,
  dashboardPage,
  loadUsersList,
  blockUser,
  unBlockUser,
  logoutAdmin,
};
