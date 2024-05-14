const Product = require("../Models/productModel");
const slugify = require("slugify");
const User = require("../Models/userModel");
const fs = require("fs");
const { promisify } = require("util");
const unlinkAsync = promisify(fs.unlink);
const path = require("path");
const Category = require("../Models/categoryModel");

//--------------------get all products =----------------------
const getAllProducts = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);

    const allProducts = await Product.find().populate("category");

    const itemsperpage = 5;
    const currentpage = parseInt(req.query.page) || 1;
    const startindex = (currentpage - 1) * itemsperpage;
    const endindex = startindex + itemsperpage;
    const totalpages = Math.ceil(allProducts.length / 5);
    const currentproduct = allProducts.slice(startindex, endindex);

    res.render("listProduct", {
      product: currentproduct,
      totalpages,
      currentpage,
      user,
    });
  } catch (error) {
    console.log(
      "Error occurred in product controller getAllProducts function",
      error
    );
  }
};

//--------------------------------------------------------------

//rendering add new prouct page--------------------
const addProduct = async (req, res) => {
  try {
    const category = await Category.find();

    res.render("addProduct", { category });
  } catch (error) {
    console.log(
      "Error happence in product controller addProduct function",
      error
    );
  }
};
//------------------------------------------------------

//create a new product and save to bd-------------------------
const createProduct = async (req, res) => {
  try {
    const { title } = req.body;
    const products = req.body;
    const productExist = await Product.findOne({ title });

    if (!productExist) {
      const caseInsensitiveCategoryExist = await Product.findOne({
        title: { $regex: new RegExp("^" + title + "$", "i") },
      });

      if (caseInsensitiveCategoryExist) {
        res.redirect("/api/admin/addProduct");
      } else {
        if (products && products.title) {
          products.slug = slugify(products.title);
        }

        const images = [];
        if (req.files && req.files.length > 0) {
          for (let i = 0; i < req.files.length; i++) {
            images.push(req.files[i].filename);
          }
        }
        
        console.log(products)
        const category = products.category;
        const findCategory = await Category.findOne({ name: category });
        const categoryId = findCategory._id;

        const newProduct = new Product({
          title: products.title,
          discription: products.discription,
          brand: products.brand,
          slug: products.title,
          price: Math.round(products.price),
          regularPrice: products.regularPrice,
          color: products.color,
          quantity: products.quantity,
          category: categoryId,
          color: products.color,
          size: products.size,
          images: images,
        });
        
        const pr = await newProduct.save();

        res.redirect("/api/admin/product");
      }
    } else {
      console.log("Product already exists");
      res.redirect("/api/admin/addProduct");
    }
  } catch (error) {
    console.log(
      "Error happened in product controller createProduct function",
      error
    );
  }
};
//----------------------------------------------------

//----rendering the a specific product edit page----------
const editProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const category = await Category.find();
    const product = await Product.findById(id).populate("category");

    if (product) {
      res.render("editProduct", { product: product, category });
    }
  } catch (error) {
    console.log(
      "Error happence in product controller editProduct function",
      error
    );
  }
};
//=-------------------------------------------------------

//-------editing a prodcut --------
const productEdited = async (req, res) => {
  try {
    const existproduct = await Product.findOne({ title: req.body.title });
    if (existproduct) {
      res.redirect(`/api/admin/editProduct?id=${req.body.id}`);
    } else {
      const caseInsensitiveCategoryExist = await Product.findOne({
        title: { $regex: new RegExp("^" + req.body.title + "$", "i") },
      });
      if (caseInsensitiveCategoryExist) {
        res.redirect(`/api/admin/editProduct?id=${req.body.id}`);
      } else {
        const id = req.body.id;
        const img =
          req.files && req.files.length > 0 ? req.files[0].filename : null;
        if (img) {
          const images = [];
          for (let i = 0; i < req.files.length; i++) {
            images.unshift(req.files[i].filename);
          }
          if (images.length === 0) {
            const product = await Product.findById(id);
            for (let i = 0; i < product.images.length; i++) {
              images.push(product.images[i]);
            }
          } else {
            const product = await Product.findById(id);
            for (let i = 0; i < product.images.length; i++) {
              images.unshift(product.images[i]);
            }
          }

          const products = req.body;
          const updatedPoduct = await Product.findByIdAndUpdate(
            id,
            {
              $set: {
                title: products.productName,
                discription: products.description,
                brand: products.brand,
                slug: products.title,
                regularPrice: Math.round(products.regularPrice),
                price: Math.round(products.salePrice),
                color: products.color,
                quantity: products.quantity,
                category: products.categoryId,
                size: products.size,
                images: images,
              },
            },
            { new: true }
          );
        } else {
          const products = req.body;
          console.log(products);
          const noImg = await Product.findByIdAndUpdate(id, {
            $set: {
              title: products.productName,
              discription: products.description,
              brand: products.brand,
              slug: products.title,
              regularPrice: Math.round(products.regularPrice),
              price: Math.round(products.salePrice),
              quantity: products.quantity,
              color: products.color,
              category: products.categoryId,
            },
          })
            .then((updatedProduct) => {
              if (!updatedProduct) {
                console.log("Product not found");
                return;
              }
              console.log("Updated user:", updatedProduct);
            })
            .catch((error) => {
              console.error("Error:", error);
            });
        }
        res.redirect("/api/admin/Product");
      }
    }
  } catch (error) {
    console.log(
      "Error happence in product controller productEdited function",
      error
    );
  }
};

//-----------------------------------------------------

//rendering the product page ---------------------------
const aProductPage = async (req, res) => {
  try {
    const userId = req.session.user;
    const user = await User.findById(userId);
    const id = req.query.id;

    const product = await Product.findById(id).populate({
      path: "individualRatings.postedBy",
      model: "User",
    });

    const relatedPr = await Product.find({ category: product.category }).limit(
      4
    );

    if (product) {
      res.render("singleProduct", { product, user, relatedPr });
    }
  } catch (error) {
    console.log(
      "Error happened in product controller aProductPage function",
      error
    );
  }
};
//-------------------------------------------

//shop page_______________________________________

const shop = async (req, res) => {
  try {
    let products, totalpages, currentpage, currentproduct, num, name, user;
    const category_id = req.query.name;
    
    // Check if a category name is provided in the query parameters
    if (req.query.name === undefined) {
      name = req.query.name;
      // No category name provided, fetch all products
      const userId = req.session.user;
      const user = await User.findById(userId);
      products = await Product.find().populate("category");

      // Pagination logic
      const itemsPerPage = 8;
      currentpage = parseInt(req.query.page) || 1;
      const startIndex = (currentpage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      totalpages = Math.ceil(products.length / itemsPerPage);
      currentproduct = products.slice(startIndex, endIndex);
      num = products.length;
    } else {
      // Category name provided, filter products by category
      name = req.query.name;
      const category = await Category.findOne({ _id: name });
      console.log(category);
      if (!category) {
        throw new Error("Category not found");
      }
      products = await Product.find({ category: name }).populate("category");

      // Pagination logic
      const itemsPerPage = 8;
      currentpage = parseInt(req.query.page) || 1;
      const startIndex = (currentpage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      totalpages = Math.ceil(products.length / itemsPerPage);
      currentproduct = products.slice(startIndex, endIndex);
      num = products.length;
    }

    res.render("shopPage", {
      products: currentproduct,
      totalpages,
      currentpage,
      user,
      num,
      name,
      category_id
    });
  } catch (error) {
    console.error("Error occurred in product controller shop function:", error);
    
    res.status(500).send("Internal Server Error");
  }
};

//---------------------------------------------------------------------

// priceWiseSort___________________________

const priceWiseSort = async (req, res) => {
  try {
    const category_id = req.query.category;
    let productData;

    if (category_id) {
      // If a category is specified, filter products by that category
      productData = await Product.find({ category: category_id }).populate("category");
    } else {
      // No category specified, fetch all products
      productData = await Product.find({}).populate("category");
    }
    
    let name;
    if (req.query.name === "low") {
      name = req.query.name;
    } else {
      name = req.query.name;
    }
   
    if (req.query.name === "low") {
    
      productData.sort((a, b) => a.price - b.price);
    } else {

      productData.sort((a, b) => b.price - a.price);
    }

    const itemsPerPage = 8;
    const currentpage = parseInt(req.query.page) || 1;
    const startIndex = (currentpage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalpages = Math.ceil(productData.length / itemsPerPage);
    const currentproduct = productData.slice(startIndex, endIndex);
    const num = productData.length;

    res.render("shopPage", {
      products: currentproduct,
      totalpages,
      currentpage,
      num,
      name,
      category_id
    });
  } catch (error) {
    console.log(error.message);
  }
};

//  ___________________________________________________________________

// charWiseSort___________________________________________________

const charWiseSort = async (req, res) => {
  try {
    const category_id = req.query.category;
    let productData;

    if (category_id) {
      // If a category is specified, filter products by that category
      productData = await Product.find({ category: category_id }).populate("category");
    } else {
      // No category specified, fetch all products
      productData = await Product.find({}).populate("category");
    }
    let name;
    if (req.query.name === "a-z") {
      name = "a-z";
    } else {
      name = "z-a";
    }

    
    if (req.query.name === "a-z") {
      // Sort alphabetically from A-Z
      productData.sort((a, b) => a.title.localeCompare(b.title));
    } else {
      // Sort alphabetically from Z-A
      productData.sort((a, b) => b.title.localeCompare(a.title));
    }

    const itemsPerPage = 8;
    const currentpage = parseInt(req.query.page) || 1;
    const startIndex = (currentpage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalpages = Math.ceil(productData.length / itemsPerPage);
    const currentproduct = productData.slice(startIndex, endIndex);
    const num = productData.length;

    res.render("shopPage", {
      products: currentproduct,
      totalpages,
      currentpage,
      num,
      name,
      category_id
    });
  } catch (error) {
    console.log(error.message);
  }
};

// _________________________________________________________________

// searchSort_____________________________________________________

const searchSort = async (req, res) => {
  try {
    const category_id = null
    const searchQuery = req.query.search;
    const products = await Product.find({
      title: { $regex: new RegExp(searchQuery, "i") },
    }).populate("category");
    let name = null;
    const itemsPerPage = 8;
    const currentpage = parseInt(req.query.page) || 1;
    const startIndex = (currentpage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalpages = Math.ceil(products.length / itemsPerPage);
    const currentproduct = products.slice(startIndex, endIndex);
    const num = products.length;

    res.render("shopPage", {
      products: currentproduct,
      totalpages,
      currentpage,
      num,
      name,
      category_id
    });
  } catch (error) {
    console.log("error happent product ctrl search :", error);
  }
};

// ________________________________________________________________

//newArrivalsSort___________________________________________________

const newArrivalsSort = async (req, res) => {
  try {
    const category_id = req.query.category;
    let products;

    if (category_id) {

      products = await Product.find({ category: category_id }).populate("category");
    } else {

      products = await Product.find({}).populate("category");
    }
    
    products.sort((a, b) =>  b._id.getTimestamp() - a._id.getTimestamp());

    let name = category_id;
    const itemsPerPage = 8;
    const currentpage = parseInt(req.query.page) || 1;
    const startIndex = (currentpage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalpages = Math.ceil(products.length / itemsPerPage);
    const currentproduct = products.slice(startIndex, endIndex);
    const num = products.length;

    res.render("shopPage", {
      products: currentproduct,
      totalpages,
      currentpage,
      num,
      name,
      category_id
    });
  } catch (error) {
    console.log(error.message);
  }
};

// _________________________________________________________________

//topRated_________________________________________________________

const topRated = async (req, res) => {
  try {
    const category_id = req.query.category;
    let products;

    if (category_id) {

      products = await Product.find({ category: category_id }).populate("category");
    } else {

      products = await Product.find({}).populate("category");
    }
    products.sort((a,b)=>b.rating.average - a.rating.average)

    let name = category_id;
    const itemsPerPage = 8;
    const currentpage = parseInt(req.query.page) || 1;
    const startIndex = (currentpage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalpages = Math.ceil(products.length / itemsPerPage);
    const currentproduct = products.slice(startIndex, endIndex);
    const num = products.length;

    res.render("shopPage", {
      products: currentproduct,
      totalpages,
      currentpage,
      num,
      name,
      category_id
    });
  } catch (error) {
    console.log("error happent product ctrl top rated :", error);
  }
};

//_______________________________________________________________

//______________________________________________________________

const featureProduct = async (req, res) => {
  try {
    const category_id = req.query.category;
    let products;

    if (category_id) {

      products = await Product.find({ category: category_id }).populate("category");
    } else {

      products = await Product.find({}).populate("category");
    }
    products.sort((a,b)=>b.price - a.price)

    let name = category_id;
    const itemsPerPage = 8;
    const currentpage = parseInt(req.query.page) || 1;
    const startIndex = (currentpage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const totalpages = Math.ceil(products.length / itemsPerPage);
    const currentproduct = products.slice(startIndex, endIndex);
    const num = products.length;

    res.render("shopPage", {
      products: currentproduct,
      totalpages,
      currentpage,
      num,
      name,
      category_id
    });
  } catch (error) {
    console.log("error happent product ctrl top rated :", error);
  }
};

//______________________________________________________________

//  list and unlist the product ----------------------

const unlistProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const unlistedProduct = await Product.findByIdAndUpdate(
      id,
      {
        status: false,
      },
      { new: true }
    );

    res.redirect("/api/admin/listProduct");
  } catch (error) {
    console.log(
      "error happence in categoryController unlistProduct function",
      error
    );
  }
};
//--------------------------------------------------------

//-------------------list a category-----------------------
const listProduct = async (req, res) => {
  try {
    const id = req.query.id;
    const unlistedProduct = await Product.findByIdAndUpdate(
      id,
      {
        status: true,
      },
      { new: true }
    );

    res.redirect("/api/admin/listProduct");
  } catch (error) {
    console.log(
      "error happence in categoryController listProduct function",
      error
    );
  }
};

//----------------------delete a single picture -------------------

const deleteSingleImage = async (req, res) => {
  try {
    console.log(req.query.id);
    const id = req.query.id;
    const imageToDelete = req.query.img;

    // Update the product in the database to remove the image reference
    const product = await Product.findByIdAndUpdate(id, {
      $pull: { images: imageToDelete },
    });

    // Delete the image file from the filesystem
    const imagePath = path.join("public", "productimages", imageToDelete);
    await unlinkAsync(imagePath);

    console.log("Deleted image:", imageToDelete);

    res.redirect(`/api/admin/editProduct?id=${product._id}`);
  } catch (error) {
    console.log(
      "Error occurred in categoryController deleteSingleImage function",
      error
    );
  }
};

//----------------------------------------------------

///sending the i value back----------------------
const modal = async (req, res) => {
  try {
    const i = req.query.i;
    res.json({ status: true, i });
  } catch (error) {
    console.log(
      "Error occurred in categoryController deleteSingleImage function",
      error
    );
  }
};
//-----------------------------------
const deleteProduct = async (req, res) => {
  try {
    const { id } = req.params;
    const deleteproduct = await Product.deleteOne({ _id: id });

    if (deleteproduct) {
      res.json({ status: "success" });
      // const deletedProduct = true
      // res.redirect(`/admin/products?deletedProduct=${deletedProduct}`)
    } else {
      res.json({ status: "error" });
    }
  } catch (error) {
    console.log(error);
  }
};

module.exports = {
  getAllProducts,
  addProduct,
  createProduct,
  editProduct,
  productEdited,
  aProductPage,
  shop,
  listProduct,
  unlistProduct,
  deleteSingleImage,
  modal,
  deleteProduct,
  priceWiseSort,
  charWiseSort,
  newArrivalsSort,
  searchSort,
  topRated,
  featureProduct,
};
