const Category = require("../Models/categoryModel");

const loadCategories = async (req, res, next) => {
  try {
    const categories = await Category.find(); // Assuming Category is your Mongoose model for categories
    res.locals.categories = categories; // Make categories available to all templates
    next();
  } catch (error) {
    console.error("Error loading categories:", error);
    res.locals.categories = []; // Set empty array if error occurs
    next(); // Proceed to the next middleware
  }
};

module.exports = loadCategories;
