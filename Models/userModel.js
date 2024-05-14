const mongoose = require("mongoose"); // Erase if already required
const bcrypt = require("bcrypt");

const addressSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
  },
  mobile: {
    type: Number,
    required: true,
  },
  pinCode: {
    type: Number,
    required: true,
  },
  addressLine: {
    type: String,
    required: true,
  },
  areaStreet: {
    type: String,
    required: true,
  },
  ladmark: {
    type: String,
    required: true,
  },
  townCity: {
    type: String,
    required: true,
  },
  state: {
    type: String,
    required: true,
  },
  adressType: {
    type: String,
    default: "Home",
  },
  main: {
    type: Boolean,
    default: false,
  },
});

// Declare the Schema of the Mongo model
var userSchema = new mongoose.Schema({
  username: {
    type: String,
    // required:true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
  },
  mobile: {
    type: String,
    required: true,
    unique: true,
  },
  password: {
    type: String,
    required: true,
  },
  is_blocked: {
    type: Boolean,
    default: false,
  },
  is_admin: {
    type: Boolean,
    default: false,
  },
  address: [addressSchema],
  cart: {
    type: Array,
    ProductId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    quantity: {
      type: Number,
      required: true,
    },
    total: {
      type: Number,
      required: true,
    },
    subTotal: {
      type: Number,
    },
  },
  wishlist: {
    type: Array,
    ProductId: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
  },
  wallet: {
    type: Number,
    default: 0,
    required: true,
  },
  history: {
    type: Array,
    amount: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      required: true,
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  },
});

userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) {
    next();
  }

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
});

userSchema.methods.isPasswordMatched = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//Export the model
module.exports = mongoose.model("User", userSchema);
