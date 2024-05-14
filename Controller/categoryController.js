const Category = require("../Models/categoryModel");
const Product = require("../Models/productModel");

//--------------rendering the category page-------------
const loadCategory = async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.render("listCategory", { categories: categories });
  } catch (error) {
    console.log(
      "error happence in categoryController loadCategory function",
      error
    );
  }
};
//----------------------------------------------------

// Load the add category page

const loadaddCategories = async (req, res) => {
  try {
    res.render("addCategory");
  } catch (error) {
    console.log(error.message);
  }
};

// ----------------------------------------

//adttCategory to data base-----------------------------
const addCategory = async (req, res) => {
  try {
    const { name, discription } = req.body;

    if (!discription) {
      return res.status(400).send("Description is required");
    }

    // Convert name to lowercase
    const categoryExist = await Category.findOne({ name: name.toUpperCase() });
    if (categoryExist) {
      res.render("addCategory", { message: "category name already exist" });
    } else {
      const caseInsensitiveCategoryExist = await Category.findOne({
        name: { $regex: new RegExp("^" + name + "$", "i") },
      });

      if (caseInsensitiveCategoryExist) {
        res.render("addCategory", { message: "category name already exist" });
      }

      const newCategory = new Category({
        name: name,
        discription: discription,
      });

      await newCategory.save();

      console.log("newCategory:", newCategory);
      res.redirect("/api/admin/Category");
    }
  } catch (error) {
    console.log(
      "Error happened in categoryController addCategory function",
      error
    );
    res.status(500).send("Error saving category");
  }
};

//-------------------------------------------------------------

// soft delete a category-------------------------
const deleteCategory = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.findById(id);

    console.log(
      "this is catogaruy",
      category,
      ">>>>>>>>>>>>>>>",
      category.name
    );

    const products = await Product.find({ category: category._id });
    console.log("this is products 0", products);

    const deletedProducts = await Product.deleteMany({
      category: category._id,
    });
    console.log("Deleted products:", deletedProducts);

    const deletedCategory = await Category.findByIdAndDelete(id);
    console.log("Deleted category:", deletedCategory);

    res.redirect("/api/admin/Category");
  } catch (error) {
    console.log(
      "Error happened in categoryController deleteCategory function",
      error
    );
    res.status(500).send("Error deleting category and associated products");
  }
};

//--------------------------------------------------------------

//-----------------edit a category--------------------
const editCategory = async (req, res) => {
  try {
    const id = req.query.id;

    const user = await Category.findById(id);

    if (user) {
      res.render("editCategory", { user: user });
    } else {
      res.redirect("/api/admin/Category");
    }
  } catch (error) {
    console.log(
      "error happence in categoryController editCategory function",
      error
    );
  }
};

//--------------------------------------------------------------

//edit the category updating ------------------------------------------
const updateCategory = async (req, res) => {
  try {
    const id = req.body.id;
    const name = req.body.name;
    const user = await Category.findById(id);
    const findname = await Category.findOne({ name: name.toUpperCase() });
    if (!findname) {
      await Category.findByIdAndUpdate(
        id,
        {
          name: req.body.name,
          discription: req.body.discription, // Use the description from the request body
        },
        { new: true }
      );
      res.redirect("/api/admin/category");
    } else {
      res.render("editCategory", {
        message: "category name already exist",
        user: user,
      });
    }
  } catch (error) {
    console.log(
      "error happence in categoryController editCategory function",
      error
    );
  }
};
//-----------------------------------------------------------

//-------------------ulist a category--------------------------
// const unlistCategory = async (req, res) => {
//     try {
//         const id = req.query.id;
//         const unlistedUser = await Category.findByIdAndUpdate(id,{
//             status:false
//         },{new:true});

//         res.redirect('/api/admin/listCategory')
//     } catch (error) {
//         console.log('error happence in categoryController unlistCategory function', error);
//     }
// }
// //-------------------------------------------------------------

// //-------------------list a category-----------------------
// const listCategory = async (req, res) => {
//     try {
//         const id = req.query.id;
//         const unlistedUser = await Category.findByIdAndUpdate(id,{
//             status:true
//         },{new:true});

//         res.redirect('/api/admin/listCategory')

//     } catch (error) {
//         console.log('error happence in categoryController listCategory function', error);
//     }
// }

//--------------------------------------------------------

module.exports = {
  loadCategory,
  // getAllCategory,
  loadaddCategories,
  addCategory,
  deleteCategory,
  editCategory,
  // unlistCategory,
  // listCategory,
  updateCategory,
};
