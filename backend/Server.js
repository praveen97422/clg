require("dotenv").config();
const cors = require("cors");
const express = require("express");

// Middleware to verify admin email
const verifyAdmin = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) {
    return res.status(401).json({ 
      success: false, 
      message: "Authorization header missing" 
    });
  }
  
  try {
    const token = authHeader.split(' ')[1];
    if (!token) {
      return res.status(401).json({ 
        success: false, 
        message: "Token missing" 
      });
    }

    // Verify Firebase JWT token
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userEmail = decodedToken.email;

    if (userEmail !== 'havyajewellery@gmail.com') {
      return res.status(403).json({ 
        success: false, 
        message: "Access denied. Admin privileges required" 
      });
    }

    // Attach user info to request
    req.user = { email: userEmail };
    next();
  } catch (error) {
    console.error('Admin verification error:', error);
    res.status(401).json({ 
      success: false, 
      message: "Invalid or expired token" 
    });
  }
};
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const admin = require("firebase-admin");

// Initialize Firebase Admin SDK from environment variables
admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

app.use("/uploads", express.static(path.join(__dirname, "uploads")));

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => console.error("❌ MongoDB connection error:", err));

const ProductSchema = new mongoose.Schema({
  name: String,
  price: Number,
  mrp: Number,
  discount: Number,
  category: String,
  stock: Number,
  description: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now },
});
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  cart: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 }
  }],
  wishlist: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' }
  }]
});
const User = mongoose.model("User", UserSchema);

// Authentication middleware
const authenticate = async (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ success: false, message: "Unauthorized" });
  
  try {
    const token = authHeader.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    req.user = { email: decodedToken.email };
    next();
  } catch (error) {
    res.status(401).json({ success: false, message: "Invalid token" });
  }
};

const Product = mongoose.model("Product", ProductSchema);

// Review Schema
const ReviewSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  userId: { type: String, required: true },
  userName: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  reviewText: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
}); 
const Review = mongoose.model("Review", ReviewSchema);

app.delete("/products/:productId/reviews/:reviewId", authenticate, async (req, res) => {
  try {
    const { productId, reviewId } = req.params;
    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    const userId = decodedToken.uid;
    const userEmail = decodedToken.email;

    // Find the review to delete
    const review = await Review.findById(reviewId);
    if (!review) {
      return res.status(404).json({ success: false, message: "Review not found" });
    }

    // Check if the review belongs to the user or if user is admin
    if (review.userId !== userId && userEmail !== 'havyajewellery@gmail.com') {
      return res.status(403).json({ success: false, message: "Unauthorized to delete this review" });
    }

    // Delete the review
    await Review.findByIdAndDelete(reviewId);

    res.status(200).json({ success: true, message: "Review deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to delete review", error });
  }
});

// Review Endpoints
app.post("/products/:id/reviews", authenticate, async (req, res) => {
  try {
    const { rating, reviewText } = req.body;
    const product = await Product.findById(req.params.id);
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    const token = req.headers.authorization.split(' ')[1];
    const decodedToken = await admin.auth().verifyIdToken(token);
    
    const newReview = new Review({
      productId: req.params.id,
      userId: decodedToken.uid,
      userName: decodedToken.name || decodedToken.email.split('@')[0],
      rating,
      reviewText
    });

    await newReview.save();
    res.status(201).json({ success: true, review: newReview });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to create review", error });
  }
});

app.get("/products/:id/reviews", async (req, res) => {
  try {
    const reviews = await Review.find({ productId: req.params.id })
      .sort({ createdAt: -1 })
      .limit(50);
    res.json({ success: true, reviews });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch reviews", error });
  }
});

// Cart Endpoints
app.get("/cart", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate('cart.productId');
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.post("/cart", authenticate, async (req, res) => {
  try {
    const { productId, quantity } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    let user = await User.findOne({ email: req.user.email });
    if (!user) {
      user = new User({ email: req.user.email, cart: [] });
    }

    const existingItem = user.cart.find(item => item.productId.toString() === productId);
    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ productId, quantity });
    }

    await user.save();
    res.status(201).json({ success: true, cart: user.cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.put("/cart/:productId", authenticate, async (req, res) => {
  try {
    const { quantity } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    const item = user.cart.find(item => item.productId.toString() === req.params.productId);
    if (!item) return res.status(404).json({ success: false, message: "Item not in cart" });

    item.quantity = quantity;
    await user.save();
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.delete("/cart/:productId", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.cart = user.cart.filter(item => item.productId.toString() !== req.params.productId);
    await user.save();
    res.json({ success: true, cart: user.cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.delete("/cart", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.cart = [];
    await user.save();
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

// Wishlist Endpoints
app.get("/wishlist", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate('wishlist.productId');
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.post("/wishlist", authenticate, async (req, res) => {
  try {
    const { productId } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    let user = await User.findOne({ email: req.user.email });
    if (!user) {
      user = new User({ email: req.user.email, cart: [], wishlist: [] });
    }

    const existingItem = user.wishlist.find(item => item.productId.toString() === productId);
    if (!existingItem) {
      user.wishlist.push({ productId });
      await user.save();
    }

    res.status(201).json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.delete("/wishlist/:productId", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.wishlist = user.wishlist.filter(item => item.productId.toString() !== req.params.productId);
    await user.save();
    res.json({ success: true, wishlist: user.wishlist });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.delete("/wishlist", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    user.wishlist = [];
    await user.save();
    res.json({ success: true, message: "Wishlist cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.post("/checkout", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email }).populate('cart.productId');
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Check stock for all items first
    for (const item of user.cart) {
      if (item.productId.stock < item.quantity) {
        return res.status(400).json({
          success: false,
          message: `Insufficient stock for ${item.productId.name}`,
          productId: item.productId._id
        });
      }
    }

    // Process each item
    for (const item of user.cart) {
      item.productId.stock -= item.quantity;
      await item.productId.save();
    }

    // Clear cart after successful checkout
    user.cart = [];
    await user.save();

    res.json({ success: true, message: "Checkout successful" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Checkout failed", error });
  }
});

app.post("/upload", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });

    const newProduct = new Product({
      name: req.body.name,
      price: Number(req.body.price),
      mrp: Number(req.body.mrp),
      discount: Number(req.body.discount),
      category: req.body.category,
      stock: Number(req.body.stock),
      description: req.body.description,
      imageUrl: `/uploads/${req.file.filename}`,
      timestamp: new Date().toISOString()
    });

    const savedProduct = await newProduct.save();
    // Return all product fields in response
    const responseProduct = {
      _id: savedProduct._id,
      name: savedProduct.name,
      price: savedProduct.price,
      mrp: savedProduct.mrp,
      discount: savedProduct.discount,
      category: savedProduct.category,
      stock: savedProduct.stock,
      description: savedProduct.description,
      imageUrl: savedProduct.imageUrl,
      timestamp: savedProduct.timestamp,
      createdAt: savedProduct.createdAt
    };
    res.status(201).json({ success: true, product: responseProduct });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.get("/products", async (req, res) => {
  try {
    const products = await Product.find().lean();
    // Map products to include all fields
    const responseProducts = products.map(product => ({
      _id: product._id,
      name: product.name,
      price: product.price,
      mrp: product.mrp,
      discount: product.discount,
      category: product.category,
      stock: product.stock,
      description: product.description,
      imageUrl: product.imageUrl,
      timestamp: product.timestamp,
      createdAt: product.createdAt
    }));
    res.json({ success: true, products: responseProducts });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.put("/edit/:id", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    const updatedProduct = await Product.findById(req.params.id);
    if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

    // Update all fields from JSON data
    // Get data directly from request body like stock endpoint
    const { name, price, mrp, discount, category, stock, description } = req.body;
    updatedProduct.name = name;
    updatedProduct.price = price;
    updatedProduct.mrp = mrp;
    updatedProduct.discount = discount;
    updatedProduct.category = category;
    updatedProduct.stock = stock;
    updatedProduct.description = description;
    updatedProduct.timestamp = new Date().toISOString();

    // Handle image update if new file provided
    if (req.file) {
      // Delete old image if exists
      if (updatedProduct.imageUrl) {
        const oldImagePath = path.join(__dirname, updatedProduct.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updatedProduct.imageUrl = `/uploads/${req.file.filename}`;
    } else if (!updatedProduct.imageUrl) {
      return res.status(400).json({ success: false, message: "Product must have an image" });
    }

    await updatedProduct.save();
    // Return all product fields in response
    const responseProduct = {
      _id: updatedProduct._id,
      name: updatedProduct.name,
      price: updatedProduct.price,
      mrp: updatedProduct.mrp,
      discount: updatedProduct.discount,
      category: updatedProduct.category,
      stock: updatedProduct.stock,
      description: updatedProduct.description,
      imageUrl: updatedProduct.imageUrl,
      timestamp: updatedProduct.timestamp,
      createdAt: updatedProduct.createdAt
    };
    res.status(200).json({ 
      success: true, 
      product: responseProduct, 
      message: "Product updated successfully" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.route("/update-stock/:id")
  .put(async (req, res) => {
    await handleStockUpdate(req, res);
  })
  .get(async (req, res) => {
    await handleStockUpdate(req, res);
  });

async function handleStockUpdate(req, res) {
  try {
    const { quantity } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.stock < quantity) {
      return res.status(400).json({ 
        success: false, 
        message: "Insufficient stock available" 
      });
    }

    product.stock -= quantity;
    await product.save();

    res.status(200).json({ 
      success: true, 
      product,
      message: "Stock updated successfully" 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
};

app.delete("/delete/:id", verifyAdmin, async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    const imagePath = path.join(__dirname, product.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Product and image deleted successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});


app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
