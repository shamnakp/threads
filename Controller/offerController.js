const User = require("../Models/userModel");
const Oder = require("../Models/orderModel");
const Product = require("../Models/productModel");
const Category = require("../Models/categoryModel");

//-------------rendering the page off offer product ----------
const productOfferpage = async (req, res) => {
  try {
    const product = await Product.find();

    const itemsperpage = 8;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(product.length / 8);
    const currentproduct = product.slice(startindex, endindex);

    res.render("productOffer", {
      product: currentproduct,
      totalpages,
      currentpage,
    });
  } catch (error) {
    console.log(
      "Error happence in the offerctrl in the funtion productOfferpage "
    );
  }
};
//---------------------------------------------------

//-----------------updating the product offer---------------
const updateOffer = async (req, res) => {
  try {
    console.log(req.body);
    const { id, offerPrice } = req.body;

    // Fetch the product before updating
    const product = await Product.findById(id);

    // Update the offerPrice and adjust the price accordingly
    product.offerPrice = offerPrice;
    product.price = product.price - offerPrice;

    // Save the updated product
    await product.save();

    console.log("Updated product:", product);

    res.redirect("/api/admin/productOfferpage");
  } catch (error) {
    console.log(
      "Error happened in the offerctrl in the function updateOffer:",
      error
    );
    // Handle the error appropriately, e.g., send an error response to the client
    res.status(500).json({ error: "Internal Server Error" });
  }
};

//------------------------------------------------------

//-------------oofer for  a category------------------
const categoryOffer = async (req, res) => {
  try {
    const category = await Category.find();

    const itemsperpage = 8;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(category.length / 8);
    const currentproduct = category.slice(startindex, endindex);

    res.render("categoryOffer", {
      category: currentproduct,
      totalpages,
      currentpage,
    });
  } catch (error) {
    console.log(
      "Error happened in the offerctrl in the function categoryOffer:",
      error
    );
  }
};
//--------------------------------------------------

//-------------------make changed in category offer --------------------------------------

const updateCategoryOffer = async (req, res) => {
  try {
    const { id, offerPercentage } = req.body;

    // Find the category
    const category = await Category.findById(id);

    // Find all products in the category
    const products = await Product.find({ category: category._id });

    // Update prices based on the offer percentage
    products.forEach(async (product) => {
      const newOfferPrice = (offerPercentage / 100) * product.price;
      const newPrice = product.price - newOfferPrice;

      // Update the product
      await Product.findByIdAndUpdate(product._id, {
        offerPrice: newOfferPrice,
        price: newPrice,
      });
    });

    console.log("Updated prices for products in category:", category.name);

    res.redirect("/api/admin/productOfferpage");
  } catch (error) {
    console.log(
      "Error happened in the offerctrl in the function updateCategoryOffer:",
      error
    );
    // Handle the error appropriately, e.g., send an error response to the client
    res.status(500).json({ error: "Internal Server Error" });
  }
};
//----------------------------------------------

module.exports = {
  productOfferpage,
  updateOffer,
  categoryOffer,
  updateCategoryOffer,
};
