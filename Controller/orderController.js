const User = require("../Models/userModel");
const Product = require("../Models/productModel");
const Oder = require("../Models/orderModel");
const mongoose = require("mongoose");
const Coupon = require("../Models/coupenModel");
const Razorpay = require("razorpay");
const PDFDocument = require("pdfkit");

let orderDb

var instance = new Razorpay({
  key_id: process.env.RAZORPAY_KEYID,
  key_secret: process.env.RAZORPAY_SECRETKEY,
});

//-------------------load oder page----------------------
const oderPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    res.render("oderPage", { user });
  } catch (error) {
    console.log("Error form oder Ctrl in the function oderPage", error);
  }
};

// -----------------------------------------------------------

//--------------------------payment selvtion page--------------------------
const chekOut = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    const coupon = await Coupon.find({
      "user.userId": { $ne: user._id },
    });

    console.log("Valid coupons:", coupon);

    const productIds = user.cart.map((cartItem) => cartItem.ProductId);
    const product = await Product.find({ _id: { $in: productIds } });

    let offer = 0;
    for (let j = 0; j < product.length; j++) {
      offer += product[j].offerPrice;
    }
    console.log("this is product offfer price", offer);
    let sum = 0;
    for (let i = 0; i < user.cart.length; i++) {
      sum += user.cart[i].subTotal;
    }
    sum = Math.round(sum * 100) / 100;

    res.render("chekOut", { user, product, sum, offer, coupon });
  } catch (error) {
    console.log("Error form oder Ctrl in the function chekOut", error);
  }
};
//---------------------------------------------------------------

//-----------------------oderplaced-----------------------------
const oderPlaced = async (req, res) => {
  try {
    // console.log(req.body);
    const { totalPrice, createdOn, date, payment, addressId } = req.body;
    // console.log(addressId);
    const userId = req.session.user;
    const user = await User.findById(userId);
    const productIds = user.cart.map((cartItem) => cartItem.ProductId);

    // console.log('product is +>>>>>>>>>>>>>>>>>>>>>>>>>',user.address);

    const address = user.address.find(
      (item) => item._id.toString() === addressId
    );

    const productDetails = await Product.find({ _id: { $in: productIds } });

    const cartItemQuantities = user.cart.map((cartItem) => ({
      ProductId: cartItem.ProductId,
      quantity: cartItem.quantity,
      price: cartItem.price, // Add the price of each product
    }));

    const orderProducts = productDetails.map((product) => ({
      ProductId: product._id,
      regularPrice: product.regularPrice,
      price: product.price,
      title: product.title,
      brand:product.brand,
      image: product.images[0],
      quantity: cartItemQuantities.find(
        (item) => item.ProductId.toString() === product._id.toString()
      ).quantity,
    }));

    const regularPriceOfOrder = orderProducts.reduce(
      (totalRegularPrice, product) => {
        const regularPrice =
          typeof product.regularPrice === "number" ? product.regularPrice : 0;
        const quantity =
          typeof product.quantity === "number" ? product.quantity : 0;
        return totalRegularPrice + regularPrice * quantity;
      },
      0
    );

    console.log("this is the regular price", regularPriceOfOrder);

    const oder = new Oder({
      totalPrice: totalPrice,
      regularPrice: regularPriceOfOrder,
      createdOn: createdOn,
      date: date,
      product: orderProducts,
      userId: userId,
      payment: payment,
      address: address,
      status: "pending",
    });
    orderDb = await oder.save();
    //-----------part that dicrese the qunatity od the cutent product --
    for (const orderedProduct of orderProducts) {
      const product = await Product.findById(orderedProduct.ProductId);
      if (product) {
        const newQuantity = product.quantity - orderedProduct.quantity;
        product.quantity = Math.max(newQuantity, 0);
        await product.save();
      }
    }
    //-------------------------------

    if (oder.payment == "cod") {
      console.log("yes iam the cod methord");
      orderDb.status = 'conformed';
      await orderDb.save();
      res.json({
        payment: true,
        method: "cod",
        order: orderDb,
        qty: cartItemQuantities,
        oderId: user,
      });
    
    } else if (oder.payment == "online") {
      console.log("yes iam the razorpay methord");

      const generatedOrder = await generateOrderRazorpay(
        orderDb._id,
        orderDb.totalPrice
      );
      res.json({
        payment: false,
        method: "online",
        razorpayOrder: generatedOrder,
        order: orderDb,
        oderId: user,
        qty: cartItemQuantities,
      });
    } else if (oder.payment == "wallet") {
      const a = (user.wallet -= totalPrice);
      const transaction = {
        amount: a,
        status: "debit",
        timestamp: new Date(), // You can add a timestamp to the transaction
      };

      // Push the transaction into the user's history array
      user.history.push(transaction);

      await user.save();
      orderDb.status = 'conformed';
      await orderDb.save();
      res.json({ payment: true, method: "wallet" });
    }
  } catch (error) {
    console.log("Error form oder Ctrl in the function oderPlaced", error);
  }
};
//---------------------------------------------



const buynowPlaceOrder = async (req, res) => {
  try {
    const { totalPrice, createdOn, date, payment, addressId, prId } = req.body;
    const userId = req.session.user;
    const user = await User.findById(userId);
    const address = user.address.find(item => item._id.toString() === addressId);
    const productDetail = await Product.findById(prId);

    const productDetails = {
      ProductId: productDetail._id,
      regularPrice: productDetail.regularPrice,
      price: productDetail.price,
      title: productDetail.title,
      brand: productDetail.brand,
      image: productDetail.images[0],
      quantity: 1,
    };

    const regularPrice = typeof productDetails.regularPrice === "number" ? productDetails.regularPrice : 0;
    const quantity = typeof productDetails.quantity === "number" ? productDetails.quantity : 0;
    const regularPriceOfOrder = regularPrice * quantity;

    const order = new Oder({
      totalPrice: totalPrice,
      regularPrice: regularPriceOfOrder,
      createdOn: createdOn,
      date: date,
      product: productDetails,
      userId: userId,
      payment: payment,
      address: address,
      status: "pending",
    });
  
    orderDb = await order.save();
    if (payment === 'cod') {
      console.log('yes iam the cod method');
      orderDb.status = 'conformed';
      await orderDb.save();
      res.json({ payment: true, method: "cod", order: orderDb , qty:1, oderId:user });

    } else if (payment === 'online') {
      console.log('yes iam the razorpay method');
      console.log(orderDb._id);
      console.log(orderDb.totalPrice);
      const generatedOrder = await generateOrderRazorpay(orderDb._id, orderDb.totalPrice);
        res.json({ payment: false, method: "online", razorpayOrder: generatedOrder, order: orderDb , oderId:user, qty:1});

    } else if (payment === 'wallet') {
      const a = user.wallet -= totalPrice;
      const transaction = {
        amount: a,
        status: "debit",
        timestamp: new Date(),
      };

      user.history.push(transaction);
      await user.save();

      // Update order status to "confirmed" for wallet payment
      orderDb.status = 'conformed';
      await orderDb.save();

      res.json({ payment: true, method: "wallet", order: orderDb });
    }
  } catch (error) {
    console.log("Error from order controller in the function buy now ", error);
    res.status(500).json({ error: "An error occurred while processing your request." });
  }
};


const pendingPayment = async(req,res)=>{
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    const {orderId} = req.body;
    const order = await Oder.findById(orderId)
    orderDb = order
    const generatedOrder = await generateOrderRazorpay(order._id, order.totalPrice);
    res.json({ payment: false, method: "online", razorpayOrder: generatedOrder, order: orderDb , oderId:user, qty:1,numericValue:order.totalPrice});

  } catch (error) {
    console.log("error happented order ctrl pendingpayment",error);
  }
}




const updateOrderStatus = async (orderId, status) => {
  try {
    // Assuming you have an Order model and you want to update the status field
    const updatedOrder = await Oder.findByIdAndUpdate(orderId, { status: status }, { new: true });
    if (!updatedOrder) {
      throw new Error("Order not found");
    }
    return updatedOrder;
  } catch (error) {
    throw error;
  }
};



//------------grnerate the razorpay -----------------
const generateOrderRazorpay = (orderId, total) => {
  return new Promise((resolve, reject) => {
      const options = {
          amount: total * 100,  // amount in the smallest currency unit
          currency: "INR",
          receipt: String(orderId)
      };
      instance.orders.create(options, function (err, order) {
          if (err) {
              console.log("failed");
              console.log(err);
              reject(err);
          } else {
              // console.log("Order Generated RazorPAY: " + JSON.stringify(order));
              resolve(order);
          }
      });
  })
}
//----------------------------------------------

//--------------------------list the oder datas ------------------------

const allOderData = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    const orders = await Oder.find({ userId: userId }).sort({ createdOn: -1 });

    const itemsperpage = 6;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(orders.length / 6);
    const currentproduct = orders.slice(startindex, endindex);

    res.render("listOrder", {
      orders: currentproduct,
      totalpages,
      currentpage,
      user,
    });
  } catch (error) {
    console.log("Error from oderCtrl in the function allOderData", error);
    res.status(500).json({ status: false, error: "Server error" });
  }
};
//--------------------------------------------------------------------

///----------------orderdetails for user side-----------------

const oderDetails = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    // console.log('this is oder id ',orderId);
    // const  id=req.query.id.toString()
    const orderdtls = req.query.id
    console.log(orderdtls);
    const userId = req.session.user;
    const user = await User.findById(userId);
    const order = await Oder.findById(orderId);

    //    console.log('thid id the odder',order);

    res.render("orderDtls", { order, user });
  } catch (error) {
    console.log("errro happemce in cart ctrl in function oderDetails", error);
  }
};

//----------------------------------------------------------------------------------------

///--------------------------cnasel oder----------------------
const canselOder = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findOne({ _id: userId }); // Use findOne to retrieve a single user document

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const orderId = req.query.orderId;
    console.log(orderId);
    const order = await Oder.findByIdAndUpdate(
      orderId,
      {
        status: "canceled",
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    if (order.payment !== "cod") {
      user.wallet += order.totalPrice;

      const transaction = {
        amount: order.totalPrice,
        status: "credit",
        timestamp: new Date(), // You can add a timestamp to the transaction
      };

      user.history.push(transaction);

      await user.save();
    }

    for (const productData of order.product) {
      const productId = productData.ProductId;
      const quantity = productData.quantity;

      const product = await Product.findById(productId);

      if (product) {
        product.quantity += quantity;
        await product.save();
      }
    }

    res.redirect("/api/allOderData");
  } catch (error) {
    console.log("Error occurred in cart ctrl in function canselOrder", error);

    res.status(500).json({ message: "Internal Server Error" });
  }
};

//-----------------------------------------------------

//------------------------------returnnorder----------------------------
const returnOrder = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const userId = req.session.user;

    const user = await User.findOne({ _id: userId });

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const order = await Oder.findByIdAndUpdate(
      orderId,
      {
        status: "returned",
      },
      { new: true }
    );

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    user.wallet += order.totalPrice;

    const transaction = {
      amount: user.wallet,
      status: "credit",
      timestamp: new Date(), // You can add a timestamp to the transaction
    };

    user.history.push(transaction);
    await user.save();

    for (const productData of order.product) {
      const productId = productData.ProductId;
      const quantity = productData.quantity;

      // Find the corresponding product in the database
      const product = await Product.findById(productId);

      if (product) {
        product.quantity += quantity;
        await product.save();
      }
    }

    res.redirect("/api/allOderData");
  } catch (error) {
    console.log("Error occurred in returnOrder function:", error);

    res.status(500).json({ message: "Internal Server Error" });
  }
};
//---------------------------------------------

//---------------------------get all orders to the admin--------------------

const orderListing = async (req, res) => {
  try {
    const orders = await Oder.find().sort({ createdOn: -1 });
    // console.log('this is orders',orders);
    const itemsperpage = 3;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(orders.length / 3);
    const currentproduct = orders.slice(startindex, endindex);

    res.render("aOderList", {
      orders: currentproduct,
      totalpages,
      currentpage,
    });
  } catch (error) {
    console.log("errro happemce in cart ctrl in function orderListing", error);
  }
};
//----------------------------------------------------------------------

////------------------order detail foradmin------------------------
const oderDetailsAdmin = async (req, res) => {
  try {
    const orderId = req.query.orderId;

    const order = await Oder.findById(orderId);
    const userId = order.userId;

    const user = await User.findById(userId);
    console.log(order.product);

    res.render("aOrderDetails", { order, user });
  } catch (error) {
    console.log(
      "errro happemce in cart order details in function oderDetails",
      error
    );
  }
};
//-----------------------------------------------------------------------------

//-------------------admin change the user orde status --------------------
//---------------------------------------------------------------
const changeStatusPending = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await Oder.findByIdAndUpdate(
      orderId,
      {
        status: "pending",
      },
      { new: true }
    );

    if (order) {
      res.json({ status: true });
    }
  } catch (error) {
    console.log(
      "errro happemce in cart ctrl in function changeStatusPending",
      error
    );
  }
};
//------------------------------------------------------------------------

//---------------------------------------------------------------
const changeStatusConfirmed = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await Oder.findByIdAndUpdate(
      orderId,
      {
        status: "conformed",
      },
      { new: true }
    );
    if (order) {
      res.json({ status: true });
    }
  } catch (error) {
    console.log(
      "errro happemce in cart ctrl in function changeStatusConfirmed",
      error
    );
  }
};
//------------------------------------------------------------------------

//---------------------------------------------------------------
const changeStatusShipped = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await Oder.findByIdAndUpdate(
      orderId,
      {
        status: "shipped",
      },
      { new: true }
    );
    if (order) {
      res.json({ status: true });
    }
  } catch (error) {
    console.log(
      "errro happemce in cart ctrl in function changeStatusShipped",
      error
    );
  }
};
//------------------------------------------------------------------------

//---------------------------------------------------------------
const changeStatusDelivered = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await Oder.findByIdAndUpdate(
      orderId,
      {
        status: "delivered",
      },
      { new: true }
    );
    if (order) {
      res.json({ status: true });
    }
  } catch (error) {
    console.log(
      "errro happemce in cart ctrl in function changeStatusDelivered",
      error
    );
  }
};
//------------------------------------------------------------------------

//---------------------------------------------------------------
const changeStatusreturned = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    const order = await Oder.findByIdAndUpdate(
      orderId,
      {
        status: "returned",
      },
      { new: true }
    );
    if (order) {
      res.json({ status: true });
    }
  } catch (error) {
    console.log(
      "errro happemce in cart ctrl in function changeStatusreturned",
      error
    );
  }
};
//------------------------------------------------------------------------

//---------------------------------------------------------------
const changeStatusCanseled = async (req, res) => {
  try {
    const orderId = req.query.orderId;
    console.log(orderId);
    const order = await Oder.findByIdAndUpdate(
      orderId,
      {
        status: "canceled",
      },
      { new: true }
    );
    if (order) {
      res.json({ status: true });
    }
  } catch (error) {
    console.log(
      "errro happemce in cart ctrl in function changeStatusCanseled",
      error
    );
  }
};
//------------------------------------------------------------------------

//-----------------------payment razorpay------------------------
const verifyPayment = async (req, res) => {
  try {
    verifyOrderPayment(req.body,orderDb);
    res.json({ status: true });
  } catch (error) {
    console.log("errro happemce in cart ctrl in function verifyPayment", error);
  }
};
//----------------------------------------------

//---------------verify the payment  razorpay-------------------------------

const verifyOrderPayment = async (details,order) => {
  console.log("DETAILS : " + JSON.stringify(details));
  return new Promise(async (resolve, reject) => {
    const crypto = require("crypto");
    let hmac = crypto.createHmac("sha256", process.env.RAZORPAY_SECRETKEY);
    hmac.update(details.razorpay_order_id + "|" + details.razorpay_payment_id);
    hmac = hmac.digest("hex");
    if (hmac === details.razorpay_signature) {
      console.log("Verify SUCCESS");
      // console.log(orderId)
      try {
        await updateOrderStatus(order._id, 'conformed');
        resolve();
      } catch (error) {
        reject(error);
      }
    } else {
      console.log("Verify FAILED");
      reject(new Error("Verification failed"));
    }
  });
};

//---------when user click wallet use chenking the cuurent sum and reduce the wallet
const useWallet = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    if (user) {
      let a = req.body;

      let sum = a.total - a.wallet;

      res.json({ status: true, sum });
    }
  } catch (error) {
    console.log("errro happemce in cart ctrl in function useWallet", error);
  }
};
///-------------------------------------------------------------------------

//----------loading sales report page ----

const loadSalesReport = async (req, res) => {
  try {
    const orders = await Oder.aggregate([
      { $match: { status: "delivered" } },
      { $sort: { date: -1 } },
    ]);

    res.render("salesReport", { orders });
  } catch (error) {
    console.log(error.message);
  }
};

// Sales report filtering

// const filterSales = async (req, res) => {
//   try {
//     const number = req.query.identify;

//     const today = new Date();
//     if (number === "0") {
//       // All time report

//       // Finding data using aggregate
//       const orders = await Oder.aggregate([
//         { $match: { status: "delivered" } },
//         { $sort: { date: -1 } },
//       ]);
//       res.json({ orders });
//     } else if (number === "1") {
//       // Daily report

//       const startOfDay = new Date(
//         today.getFullYear(),
//         today.getMonth(),
//         today.getDate()
//       );
//       const endOfDay = new Date(
//         today.getFullYear(),
//         today.getMonth(),
//         today.getDate() + 1
//       );

//       // Finding data using aggregate
//       const orders = await Oder.aggregate([
//         {
//           $match: {
//             status: "delivered",
//             createdOn: {
//               $gte: startOfDay,
//               $lt: endOfDay,
//             },
//           },
//         },
//         {
//           $project: {
//             createdOn: 1,
//             totalPrice: 1,
//           },
//         },
//         { $sort: { createdOn: -1 } },
//       ]);
//       console.log(orders);
//       res.json({ orders });
//     } else if (number === "2") {
//       // Weekly Report

//       const currentDay = today.getDay();
//       const startofWeek = new Date(today);
//       startofWeek.setDate(today.getDate() - currentDay); // We will get the sunday "0"

//       const endofWeek = new Date(today);
//       endofWeek.setDate(today.getDate() + 6 - currentDay); // we will get the saturday it means "6"

//       const orders = await Oder.aggregate([
//         {
//           $match: {
//             status: "delivered",
//             createdOn: {
//               $gte: startofWeek,
//               $lte: endofWeek,
//             },
//           },
//         },
//         {
//           $project: {
//             createdOn: 1,
//             totalPrice: 1,
//           },
//         },
//         { $sort: { createdOn: -1 } },
//       ]);
//       res.json({ orders });
//     } else if (number === "3") {
//       // Monthly Report

//       // Finding data using aggregate
//       const startofMonth = new Date(today.getFullYear(), today.getMonth(), 1);
//       const endofMonth = new Date(
//         today.getFullYear(),
//         today.getMonth() + 1,
//         0,
//         23,
//         59,
//         59,
//         999
//       );

//       const orders = await Oder.aggregate([
//         {
//           $match: {
//             status: "delivered",
//             createdOn: {
//               $gte: startofMonth,
//               $lte: endofMonth,
//             },
//           },
//         },
//         {
//           $project: {
//             createdOn: 1,
//             totalPrice: 1,
//           },
//         },
//         { $sort: { createdOn: -1 } },
//       ]);
//       console.log("orders:", orders);
//       res.json({ orders });
//     } else if (number === "4") {
//       // Yearly Report

//       const startOfYear = new Date(today.getFullYear(), 0, 1); // January is 0
//       const endOfYear = new Date(
//         today.getFullYear() + 1,
//         0,
//         0,
//         23,
//         59,
//         59,
//         999
//       ); // December 31, last millisecond

//       const orders = await Oder.aggregate([
//         {
//           $match: {
//             status: "delivered",
//             createdOn: {
//               $gte: startOfYear,
//               $lte: endOfYear,
//             },
//           },
//         },
//         {
//           $project: {
//             createdOn: 1,
//             totalPrice: 1,
//           },
//         },
//         { $sort: { createdOn: -1 } },
//       ]);
//       res.json({ orders });
//     }
//     // res.render('sales-report')
//   } catch (error) {
//     console.log(error.message);
//   }
// };



const filterSales = async (req, res) => {
  try {
    const number = req.query.identify;
    const today = new Date();
    let aggregationPipeline = [];

    switch (number) {
      case "0": // All time report
        aggregationPipeline.push(
          { $match: { status: "delivered" } },
          { $sort: { date: -1 } }
        );
        break;
      
      case "1": // Daily report
        const startOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate()
        );
        const endOfDay = new Date(
          today.getFullYear(),
          today.getMonth(),
          today.getDate() + 1
        );
        aggregationPipeline.push(
          {
            $match: {
              status: "delivered",
              createdOn: {
                $gte: startOfDay,
                $lt: endOfDay,
              },
            },
          },
          { $sort: { createdOn: -1 } }
        );
        break;
      
      case "2": // Weekly Report
        const currentDay = today.getDay();
        const startOfWeek = new Date(today);
        startOfWeek.setDate(today.getDate() - currentDay);
        const endOfWeek = new Date(today);
        endOfWeek.setDate(today.getDate() + 6 - currentDay);
        aggregationPipeline.push(
          {
            $match: {
              status: "delivered",
              createdOn: {
                $gte: startOfWeek,
                $lte: endOfWeek,
              },
            },
          },
          { $sort: { createdOn: -1 } }
        );
        break;
      
      case "3": // Monthly Report
        const startOfMonth = new Date(today.getFullYear(), today.getMonth(), 1);
        const endOfMonth = new Date(today.getFullYear(), today.getMonth() + 1, 0, 23, 59, 59, 999);
        aggregationPipeline.push(
          {
            $match: {
              status: "delivered",
              createdOn: {
                $gte: startOfMonth,
                $lte: endOfMonth,
              },
            },
          },
          { $sort: { createdOn: -1 } }
        );
        break;
      
      case "4": // Yearly Report
        const startOfYear = new Date(today.getFullYear(), 0, 1);
        const endOfYear = new Date(today.getFullYear() + 1, 0, 0, 23, 59, 59, 999);
        aggregationPipeline.push(
          {
            $match: {
              status: "delivered",
              createdOn: {
                $gte: startOfYear,
                $lte: endOfYear,
              },
            },
          },
          { $sort: { createdOn: -1 } }
        );
        break;
      
      default:
        return res.status(400).json({ error: "Invalid time filter" });
    }

    aggregationPipeline.push(
      {
        $project: {
          orderId: "$_id",
          productName: { $arrayElemAt: ["$product.title", 0] },
          date: { $dateToString: { format: "%Y-%m-%d", date: "$createdOn" } },
          regularPrice: "$regularPrice",
          discount: { $subtract: ["$regularPrice", "$totalPrice"] },
          sellingPrice: { $arrayElemAt: ["$product.price", 0] },
          quantity: { $arrayElemAt: ["$product.quantity", 0] },
          payment: "$payment",
          totalAmount: "$totalPrice",
        },
      }
    );

    const orders = await Oder.aggregate(aggregationPipeline);
    console.log("this is the orders:",orders);
    res.json({ orders });
  } catch (error) {
    console.log(error.message);
    res.status(500).json({ error: "Internal Server Error" });
  }
};





// Sales report limited in dates

const dateWiseSales = async (req, res) => {
  try {
    let { startingDate, endingDate } = req.body;
    // console.log('Started :',startingDate)
    // console.log('End :',endingDate)
    startingDate = new Date(startingDate);
    endingDate = new Date(endingDate);

    const orders = await Oder.aggregate([
      {
        $match: {
          status: "delivered",
          createdOn: {
            $gte: startingDate,
            $lte: endingDate,
          },
        },
      },
      {
        $project: {
          createdOn: 1,
          totalPrice: 1,
        },
      },
      { $sort: { createdOn: -1 } },
    ]);
    res.json({ orders });
  } catch (error) {
    console.log(error.message);
  }
};

// Generate sales report in pdf
const generateSalesPdf = async (req, res) => {
  try {
    const doc = new PDFDocument();
    const filename = "sales-report.pdf";
    const orders = req.body;

    // Set content type to PDF
    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename=${filename}`);

    // Pipe the PDF kit to the response
    doc.pipe(res);

    // Add content to the PDF
    doc.fontSize(12);
    doc.text("Sales Report", { align: "center", fontSize: 16 });
    const margin = 10; // 1 inch margin

    doc
      .moveTo(margin, margin) // Top-left corner (x, y)
      .lineTo(600 - margin, margin) // Top-right corner (x, y)
      .lineTo(600 - margin, 842 - margin) // Bottom-right corner (x, y)
      .lineTo(margin, 842 - margin) // Bottom-left corner (x, y)
      .lineTo(margin, margin) // Back to top-left to close the rectangle
      .lineTo(600 - margin, margin) // Draw line across the bottom edge
      .lineWidth(3)
      .strokeColor("#000000")
      .stroke();

    doc.moveDown();

    // Define table headers
    const headers = ["Order ID", "Date", "Total"];

    // Calculate position for headers
    let headerX = 20;
    let headerY = doc.y + 10;

    // Draw headers
    headers.forEach((header) => {
      doc.text(header, headerX, headerY);
      headerX += 220; // Adjust spacing as needed
    });

    // Calculate position for data
    let dataY = headerY + 25;

    // Draw data
    orders.forEach((order) => {
      doc.text(order.orderId, 20, dataY);
      doc.text(order.date, 240, dataY);
      console.log(order.totalAmount);
      doc.text(`Rs ${order.totalAmount}`, 460, dataY);
      dataY += 25; // Adjust spacing as needed
    });

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.log(error.message);
  }
};


const generateSalesCsv = async (req, res) => {
  try {
      const orders = req.body;

      // Convert orders data to CSV string
      let csv = "Order ID,Date,Total\n";
      orders.forEach(order => {
          csv += `${order.orderId},${order.date},${order.totalAmount}\n`;
      });

      // Set headers for CSV download
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader('Content-Disposition', 'attachment; filename=sales-report.csv');

      // Send the CSV data as the response
      res.status(200).send(csv);
  } catch (error) {
      console.log(error.message);
      res.status(500).send('Internal Server Error');
  }
};


/////------------------a single product buyNOw --------
const buyNOw = async (req, res) => {
  try {
    const product = await Product.findById(req.query.id);

    if (product.quantity >= 1) {
      const id = req.session.user;
      const user = await User.findById(id);
      const coupon = await Coupon.find({
        "user.userId": { $ne: user._id },
      });

      let sum = product.price;
      res.render("buyNow", { user, product, sum, coupon });
    } else {
      res.redirect(`/api/aProduct?id=${product._id}`);
    }
  } catch (error) {
    console.log("Error occurred in orderCTrl buyNOw:", error);
  }
};

module.exports = {
  oderPage,
  chekOut,
  oderPlaced,
  allOderData,
  oderDetails,
  canselOder,
  orderListing,
  oderDetailsAdmin,
  changeStatusPending,
  changeStatusConfirmed,
  changeStatusShipped,
  changeStatusDelivered,
  changeStatusreturned,
  changeStatusCanseled,
  verifyPayment,
  useWallet,
  returnOrder,
  buyNOw,
  buynowPlaceOrder,
  loadSalesReport,
  filterSales,
  dateWiseSales,
  generateSalesPdf,
  generateSalesCsv,
  pendingPayment
};
