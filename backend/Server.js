require("dotenv").config();
const cors = require("cors");
const express = require("express");
const mongoose = require("mongoose");
const multer = require("multer");
const path = require("path");
const fs = require("fs");
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
const Product = mongoose.model("Product", ProductSchema);

app.post("/upload", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });

    const productData = JSON.parse(req.body.data);
    const newProduct = new Product({
      name: productData.name,
      price: Number(productData.price),
      mrp: Number(productData.mrp),
      discount: Number(productData.discount),
      category: productData.category,
      stock: Number(productData.stock),
      description: productData.description,
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

app.put("/edit/:id", upload.single("image"), async (req, res) => {
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

    // Handle image update
    if (req.file) {
      // Delete old image if exists
      if (updatedProduct.imageUrl) {
        const oldImagePath = path.join(__dirname, updatedProduct.imageUrl);
        if (fs.existsSync(oldImagePath)) {
          fs.unlinkSync(oldImagePath);
        }
      }
      updatedProduct.imageUrl = `/uploads/${req.file.filename}`;
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

app.delete("/delete/:id", async (req, res) => {
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

app.get('/test-stock-endpoint', (req, res) => {
  res.json({ message: 'Test endpoint working', status: 200 });
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);
});
