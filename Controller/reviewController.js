const Oder = require("../Models/orderModel");
const Product = require("../Models/productModel");
require("mongoose").mongoose.BSON = require("bson");
const BSON = require("bson");

//-----------creteing a review-----------
const review = async (req, res) => {
  try {
    const userId = req.session.user;
    const { comment, rating, productId, orderId } = req.body;

    console.log("this is body ", req.body);

    const product = await Product.findById(productId);

    const newRating = {
      star: Number(rating),
      review: comment,
      postedBy: new BSON.ObjectId(userId),
    };

    const existingRatingIndex = product.individualRatings.findIndex(
      (rating) => String(rating.postedBy) === String(userId)
    );

    console.log(existingRatingIndex, "<<<<<<<<<<<");

    if (existingRatingIndex !== -1) {
      // Update the existing rating if found
      product.individualRatings[existingRatingIndex] = newRating;
    } else {
      console.log("JJJJJJJ");
      // Add a new rating if not found
      product.individualRatings.push(newRating);
    }

    // Recalculate the average rating and total ratings
    const totalRatings = product.individualRatings.length;
    const sumRatings = product.individualRatings.reduce(
      (sum, rating) => sum + rating.star,
      0
    );
    const averageRating = totalRatings > 0 ? sumRatings / totalRatings : 0;

    // Update the product with the new average rating and total ratings
    product.rating = {
      average: averageRating,
      totalRatings: totalRatings,
    };
    console.log("Before serialization:", product);
    const updatePr = await product.save();
    console.log("After serialization:", updatePr);

    res.redirect(`/api/aProduct?id=${productId}`);
  } catch (error) {
    console.log("Error Happened in review Ctrl in the function review", error);
  }
};
//-------------------------------------------------

module.exports = {
  review,
};
