require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors()); // Enable CORS
app.use(express.json()); // Middleware for parsing JSON

// Ensure "uploads/" directory exists
const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Serve static files from "uploads" folder
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// Set up multer for file uploads
const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    cb(null, Date.now() + path.extname(file.originalname));
  },
});
const upload = multer({ storage });

// Connect to MongoDB
mongoose.connect(process.env.MONGO_URI, {
  useNewUrlParser: true,
  useUnifiedTopology: true,
})
.then(() => console.log("✅ MongoDB connected successfully"))
.catch(err => console.error("❌ MongoDB connection error:", err));

// Product Schema
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
  timestamp: { type: Date, default: Date.now }, // Add timestamp field
});
const Product = mongoose.model("Product", ProductSchema);

// Upload Product Route
app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });

    const newProduct = new Product({
      name: req.body.name,
      price: req.body.price,
      mrp: req.body.mrp,
      discount: req.body.discount,
      category: req.body.category,
      stock: req.body.stock,
      imageUrl: `/uploads/${req.file.filename}`,
      description: req.body.description, // Include description in new product
      timestamp: new Date().toISOString(), // Set timestamp to current time
    });

    const savedProduct = await newProduct.save();
    res.status(201).json({ success: true, product: savedProduct });
  } catch (error) {
    console.error("Error uploading product:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

// Fetch All Products
app.get("/products", async (req, res) => {
  try {
    const products = await Product.find();
 // console.log("Fetched Products:", products); // Log the fetched products
    res.json({ success: true, products });
  } catch (error) {
    console.error("Error fetching products:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

// Edit Product Route
app.put("/edit/:id", async (req, res) => {
  try {
console.log("Updating Product Data:", req.body); // Log the incoming product data
const updatedProduct = await Product.findById(req.params.id);
// console.log("Updating Product:", updatedProduct); // Log the product being updated
if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

updatedProduct.name = req.body.name;
updatedProduct.price = req.body.price;
updatedProduct.mrp = req.body.mrp;
updatedProduct.discount = req.body.discount;
updatedProduct.category = req.body.category;
updatedProduct.stock = req.body.stock;
updatedProduct.description = req.body.description; // Update description
if (req.file) {
    updatedProduct.imageUrl = `/uploads/${req.file.filename}`;
}
await updatedProduct.save();

    if (!updatedProduct) return res.status(404).json({ success: false, message: "Product not found" });

    res.status(200).json({ success: true, product: updatedProduct, message: "Product updated successfully" });

  } catch (error) {
    console.error("Error updating product:", error.message);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

// Delete Product Route (Also Deletes Image File)
app.delete("/delete/:id", async (req, res) => {
  try {
    const product = await Product.findById(req.params.id);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    // Delete the image file
    const imagePath = path.join(__dirname, product.imageUrl);
    if (fs.existsSync(imagePath)) {
      fs.unlinkSync(imagePath);
    }

    await Product.findByIdAndDelete(req.params.id);
    res.status(200).json({ success: true, message: "Product and image deleted successfully" });
  } catch (error) {
    console.error("Error deleting product:", error);
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

// Start the server
app.listen(PORT, () => {
  console.log(`🚀 Server is running on http://localhost:${PORT}`);
});
