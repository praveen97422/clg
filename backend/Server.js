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
const sharp = require("sharp");
const admin = require("firebase-admin");

admin.initializeApp({
  credential: admin.credential.cert({
    projectId: process.env.FIREBASE_PROJECT_ID,
    clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
    privateKey: process.env.FIREBASE_PRIVATE_KEY.replace(/\\n/g, '\n')
  })
});

const app = express();
const PORT = process.env.PORT || 5000;

// Configure CORS
const corsOptions = {
  origin: '*', // Allow all origins
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'Accept'],
  exposedHeaders: ['Content-Length', 'Content-Type'],
  credentials: false,
  maxAge: 86400 // 24 hours
};

app.use(cors(corsOptions));

// Add CORS headers for all routes
app.use((req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  next();
});

app.use(express.json());

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir);
}

// Add CORS headers for static files
app.use("/uploads", (req, res, next) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept');
  res.setHeader('Access-Control-Expose-Headers', 'Content-Length, Content-Type');
  next();
}, express.static(path.join(__dirname, "uploads")));

const pingRoute = require('./pingRoute');
app.use('/', pingRoute);

const storage = multer.diskStorage({
  destination: uploadDir,
  filename: (req, file, cb) => {
    // Convert HEIC to JPG in filename
    const ext = file.originalname.toLowerCase().endsWith('.heic') ? '.jpg' : path.extname(file.originalname);
    cb(null, Date.now() + ext);
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
  ringSize: { type: Map, of: Number, default: {} }, // Changed to Map of Number for ring size stock
  option: String, // Added field for selected option
  name: String,
  price: Number,
  mrp: Number,
  discount: Number,
  category: String,
  subcategories: [String], // Added subcategories field as array of strings
  stock: Number,
  description: String,
  imageUrl: String,
  createdAt: { type: Date, default: Date.now },
  timestamp: { type: Date, default: Date.now },
});
const UserSchema = new mongoose.Schema({
  email: { type: String, required: true, unique: true },
  name: { type: String, required: false },
  dob: { type: Date, required: false },
  address: { type: String, required: false },
  phoneNumber: { type: String, required: false },
  additionalPhoneNumber: { type: String, required: false },
  cart: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    quantity: { type: Number, default: 1 },
    ringSize: { type: String, default: null } // Added ringSize field to cart items
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
    const { productId, quantity, ringSize } = req.body;
    const product = await Product.findById(productId);
    if (!product) return res.status(404).json({ success: false, message: "Product not found" });

    let user = await User.findOne({ email: req.user.email });
    if (!user) {
      user = new User({ email: req.user.email, cart: [] });
    }

    // Check if item with same productId and ringSize exists
    const existingItem = user.cart.find(item => 
      item.productId.toString() === productId && 
      (item.ringSize || null) === (ringSize || null)
    );

    if (existingItem) {
      existingItem.quantity += quantity;
    } else {
      user.cart.push({ productId, quantity, ringSize: ringSize || null });
    }

    await user.save();
    res.status(201).json({ success: true, cart: user.cart });
  } catch (error) {
    res.status(500).json({ success: false, message: "Server Error", error });
  }
});

app.put("/cart/:productId", authenticate, async (req, res) => {
  try {
    const { quantity, ringSize } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Find item with matching productId and ringSize
    const item = user.cart.find(item => 
      item.productId.toString() === req.params.productId &&
      (item.ringSize || null) === (ringSize || null)
    );
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
    const ringSize = req.query.ringSize;
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    // Remove item with matching productId and ringSize
    user.cart = user.cart.filter(item => 
      !(item.productId.toString() === req.params.productId && (item.ringSize || null) === (ringSize || null))
    );
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

  
// Define Order schema
const OrderSchema = new mongoose.Schema({
  userEmail: { type: String, required: true },
  userDetails: {
    name: String,
    dob: Date,
    address: String,
    phoneNumber: String,
    additionalPhoneNumber: String,
  },
  items: [{
    productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product' },
    name: String,
    price: Number,
    quantity: Number,
    ringSize: String,
  }],
  paymentMethod: String,
  couponCode: String,
  totalAmount: Number,
  status: { type: String, default: 'Pending' },
  trackingId: { type: String, default: null }, // Added trackingId field
  createdAt: { type: Date, default: Date.now }
});
const Order = mongoose.model("Order", OrderSchema);

const nodemailer = require('nodemailer');

// Brevo SMTP configuration
const transporter = nodemailer.createTransport({
  host: process.env.BREVO_SMTP_HOST,
  port: process.env.BREVO_SMTP_PORT ? parseInt(process.env.BREVO_SMTP_PORT) : 587,
  secure: false, // true for 465, false for other ports
  auth: {
    user: process.env.BREVO_SMTP_USER, // Brevo SMTP username (usually your email)
    pass: process.env.BREVO_SMTP_PASS, // Brevo SMTP password or API key
  },
});

async function sendOrderEmail(to, subject, html) {
  if (!to) {
    throw new Error("No recipient email address provided");
  }
  const mailOptions = {
    from: process.env.BREVO_SMTP_FROM_EMAIL, // sender address
    to: Array.isArray(to) ? to.join(", ") : to,
    subject,
    html,
  };
  await transporter.sendMail(mailOptions);
}

app.post("/checkout", authenticate, async (req, res) => {
  try {
    const user = await User.findOne({ email: req.user.email });
    if (!user) return res.status(404).json({ success: false, message: "User not found" });

    if (!req.body.userDetails || !req.body.userDetails.name || !req.body.userDetails.address || !req.body.userDetails.phoneNumber) {
      return res.status(400).json({ success: false, message: "User details are incomplete" });
    }

    const orderItemsFromReq = req.body.items;
    if (!orderItemsFromReq || !Array.isArray(orderItemsFromReq) || orderItemsFromReq.length === 0) {
      return res.status(400).json({ success: false, message: "Order items are missing or invalid" });
    }

    // Fetch products for stock validation and update
    const productIds = orderItemsFromReq.map(item => item.productId);
    const products = await Product.find({ _id: { $in: productIds } });

    // Map products by id for quick lookup
    const productMap = new Map();
    products.forEach(p => productMap.set(p._id.toString(), p));

    // Check stock for all items first
    for (const item of orderItemsFromReq) {
      const product = productMap.get(item.productId);
      if (!product) {
        return res.status(400).json({ success: false, message: `Product not found: ${item.name || item.productId}` });
      }
      if (product.category === "Rings" && item.ringSize) {
        const ringStock = product.ringSize.get(item.ringSize);
        if (ringStock === undefined || ringStock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ring size ${item.ringSize} of ${product.name}`,
            productId: product._id
          });
        }
      } else {
        if (product.stock < item.quantity) {
          return res.status(400).json({
            success: false,
            message: `Insufficient stock for ${product.name}`,
            productId: product._id
          });
        }
      }
    }

    // Process each item and prepare order items array, update stock
    const orderItems = [];
    for (const item of orderItemsFromReq) {
      const product = productMap.get(item.productId);
      if (product.category === "Rings" && item.ringSize) {
        const currentStock = product.ringSize.get(item.ringSize);
        product.ringSize.set(item.ringSize, currentStock - item.quantity);
      } else {
        product.stock -= item.quantity;
      }
      await product.save();

      orderItems.push({
        productId: product._id,
        name: product.name,
        price: product.price,
        quantity: item.quantity,
        ringSize: item.ringSize || null,
      });
    }

    // Calculate total amount
    const totalAmount = orderItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Create order document
    const order = new Order({
      userEmail: req.user.email,
      userDetails: req.body.userDetails,
      items: orderItems,
      paymentMethod: req.body.paymentMethod,
      couponCode: req.body.couponCode,
      totalAmount,
      status: 'Pending',
    });
    await order.save();

    // Clear cart after successful checkout
    user.cart = [];
    await user.save();

    // Send email notifications
    const userEmailHtml = `
      <h1>Your Order has been sucesfully placed</h1>
      <p>Thank you for your order, ${order.userDetails.name}!</p>
      <p>Order ID: ${order._id}</p>
      <p>Items Ordered: ${order.items}</p>
      <p>Your order will be processed shortly.</p>
      <p>Total Amount: ₹${totalAmount.toFixed(2)}</p>
      <p>We will notify you when your order is shipped.</p>
    `;
    const adminEmailHtml = `
      <h1>New Order Placed</h1>
      <p>Order ID: ${order._id}</p>
      <p>User: ${order.userDetails.name} (${order.userEmail})</p>
      <h3>Products Ordered:</h3>
      <ul>
        ${order.items.map(item => `<li>${item.name} - Qty: ${item.quantity} ${item.ringSize ? `(Ring Size: ${item.ringSize})` : ''}</li>`).join('')}
      </ul>
      <p>Total Amount: ₹${totalAmount.toFixed(2)}</p>
      <p>Check admin panel for details.</p>
    `;

    if (!order.userEmail) {
      console.error("Order userEmail is missing");
      return res.status(400).json({ success: false, message: "Order user email is missing" });
    }
    if (!process.env.ADMIN_EMAIL) {
      console.error("ADMIN_EMAIL environment variable is missing");
      return res.status(500).json({ success: false, message: "Admin email not configured" });
    }
    // console.log("Sending order confirmation email to user:", order.userEmail);
    // console.log("Sending new order notification email to admin:", process.env.ADMIN_EMAIL);

    await sendOrderEmail(order.userEmail, 'Your Order Confirmation', userEmailHtml);
    await sendOrderEmail(process.env.ADMIN_EMAIL, 'New Order Placed', adminEmailHtml);

    res.json({ success: true, message: "Checkout successful", orderId: order._id });
  } catch (error) {
    console.error("Checkout error stack:", error.stack || error);
    res.status(500).json({ success: false, message: "Checkout failed", error: error.message || error });
  }
});

// Endpoint to get orders for authenticated user
app.get("/orders/user", authenticate, async (req, res) => {
  try {
    const orders = await Order.find({ userEmail: req.user.email }).sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user orders", error });
  }
});

// Endpoint to get all orders for admin
app.get("/orders/admin", verifyAdmin, async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    res.json({ success: true, orders });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch all orders", error });
  }
});

// Endpoint for admin to update tracking ID of an order
app.put("/orders/:orderId/tracking", verifyAdmin, async (req, res) => {
  try {
    const { trackingId } = req.body;
    if (!trackingId) {
      return res.status(400).json({ success: false, message: "Tracking ID is required" });
    }
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    order.trackingId = trackingId;
    await order.save();

    // Removed sending tracking update email as per user request

    res.json({ success: true, message: "Tracking ID updated", trackingId });
  } catch (error) {
    console.error("Update tracking ID error:", error);
    res.status(500).json({ success: false, message: "Failed to update tracking ID", error: error.message || error });
  }
});

// Endpoint for admin to send order confirmation emails on demand
app.post("/orders/:orderId/send-email", verifyAdmin, async (req, res) => {
  try {
    const orderId = req.params.orderId;
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    if (!order.userEmail) {
      console.error("Order userEmail is missing");
      return res.status(400).json({ success: false, message: "Order user email is missing" });
    }
    if (!process.env.ADMIN_EMAIL) {
      console.error("ADMIN_EMAIL environment variable is missing");
      return res.status(500).json({ success: false, message: "Admin email not configured" });
    }

    const totalAmount = order.totalAmount.toFixed(2);

    const userEmailHtml = `
      <h1>Order Confirmation</h1>
      <P>Your order has been successfully confrimed</P>
      <p>Thank you for your order, ${order.userDetails.name}!</p>
      <p>Order ID: ${order._id}</p>
      <p>Total Amount: ₹${totalAmount}</p>
      <p>you can track your oder using the below link</p>
      ${order.trackingId ? `<p>Tracking ID: <strong>${order.trackingId}</strong></p>` : ''}
    `;
    // const adminEmailHtml = `
    //   <h1>New Order Placed</h1>
    //   <p>Order ID: ${order._id}</p>
    //   <p>User: ${order.userDetails.name} (${order.userEmail})</p>
    //   <p>Total Amount: ₹${totalAmount}</p>
    //   <p>Check admin panel for details.</p>
    //   ${order.trackingId ? `<p>Tracking ID: <strong>${order.trackingId}</strong></p>` : ''}
    // `;

    // Removed console logs for email sending to clean terminal output
    // console.log("Sending order confirmation email to user:", order.userEmail);
    // console.log("Sending new order notification email to admin:", process.env.ADMIN_EMAIL);

    await sendOrderEmail(order.userEmail, 'Your Order Confirmation', userEmailHtml);
    // await sendOrderEmail(process.env.ADMIN_EMAIL, 'New Order Placed', adminEmailHtml);

    res.json({ success: true, message: "Order emails sent successfully" });
  } catch (error) {
    console.error("Send order email error:", error);
    res.status(500).json({ success: false, message: "Failed to send order emails", error: error.message || error });
  }
});

// Endpoint for admin to update order status
app.put("/orders/:orderId/status", verifyAdmin, async (req, res) => {
  try {
    const { status } = req.body;
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }
    const order = await Order.findById(req.params.orderId);
    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }
    order.status = status;
    await order.save();

    res.json({ success: true, message: "Order status updated", status });
  } catch (error) {
    console.error("Update order status error:", error);
    res.status(500).json({ success: false, message: "Failed to update order status", error: error.message || error });
  }
});

app.post("/upload", verifyAdmin, upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ success: false, message: "No image uploaded" });

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp','image/avif','image/hevc','image/jpg'];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({ 
        success: false, 
        message: "Invalid file type. Only JPEG, PNG, and HEIC images are allowed" 
      });
    }

    const filePath = path.join(__dirname, "uploads", req.file.filename);
    const compressedFilePath = filePath; // overwrite original file

    // Use sharp to process image
    let quality = 80;
    let buffer;
    let attempts = 0;
    const maxAttempts = 5; // Limit quality reduction attempts

    try {
      // Handle HEIC files
      if (req.file.originalname.toLowerCase().endsWith('.heic')) {
        buffer = await sharp(filePath, { input: { failOn: 'none' } })
          .toFormat('jpeg')
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      } else {
        buffer = await sharp(filePath)
          .resize({ width: 800, withoutEnlargement: true })
          .jpeg({ quality, mozjpeg: true })
          .toBuffer();
      }

      // Reduce quality until size < 100kb or quality < 30 or max attempts reached
      while (buffer.length > 100 * 1024 && quality >= 30 && attempts < maxAttempts) {
        quality -= 10;
        attempts++;
        
        if (req.file.originalname.toLowerCase().endsWith('.heic')) {
          buffer = await sharp(filePath, { input: { failOn: 'none' } })
            .toFormat('jpeg')
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
        } else {
          buffer = await sharp(filePath)
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
        }
      }

      // Save processed image
      await sharp(buffer).toFile(compressedFilePath);

      // Parse ringSize if sent as JSON string
      let ringSizeData = {};
      if (req.body.ringSize) {
        try {
          ringSizeData = typeof req.body.ringSize === 'string' ? JSON.parse(req.body.ringSize) : req.body.ringSize;
        } catch (e) {
          return res.status(400).json({ success: false, message: "Invalid ringSize format" });
        }
      }

      // Parse subcategories if sent as JSON string
      let subcategoriesData = [];
      if (req.body.subcategories) {
        try {
          subcategoriesData = typeof req.body.subcategories === 'string' ? JSON.parse(req.body.subcategories) : req.body.subcategories;
        } catch (e) {
          return res.status(400).json({ success: false, message: "Invalid subcategories format" });
        }
      }

      const newProduct = new Product({
        name: req.body.name,
        price: Number(req.body.price),
        mrp: Number(req.body.mrp),
        discount: Number(req.body.discount),
        category: req.body.category,
        subcategories: subcategoriesData,
        stock: req.body.category === "Rings" && ringSizeData
          ? Object.values(ringSizeData).reduce((acc, val) => acc + Number(val), 0)
          : Number(req.body.stock),
        description: req.body.description,
        option: req.body.option,
        ringSize: ringSizeData,
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
        subcategories: savedProduct.subcategories,
        stock: savedProduct.stock,
        description: savedProduct.description,
        option: savedProduct.option,
        ringSize: savedProduct.ringSize,
        imageUrl: savedProduct.imageUrl,
        timestamp: savedProduct.timestamp,
        createdAt: savedProduct.createdAt
      };
      
      res.status(201).json({ success: true, product: responseProduct });
    } catch (error) {
      // Clean up uploaded file if processing fails
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
      throw error; // Re-throw to be caught by outer try-catch
    }
  } catch (error) {
    console.error("Image upload error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to process image upload", 
      error: error.message 
    });
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
      subcategories: product.subcategories,
      stock: product.stock,
      description: product.description,
      option: product.option,
      ringSize: product.ringSize,
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

    // Handle image update if new file provided
    if (req.file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'image/heic', 'image/heif', 'image/webp', 'image/avif', 'image/hevc', 'image/jpg'];
      if (!allowedTypes.includes(req.file.mimetype)) {
        return res.status(400).json({ 
          success: false, 
          message: "Invalid file type. Only JPEG, PNG, HEIC, WebP, AVIF, and HEVC images are allowed" 
        });
      }

      const filePath = path.join(__dirname, "uploads", req.file.filename);
      const compressedFilePath = filePath;

      // Use sharp to process image
      let quality = 80;
      let buffer;
      let attempts = 0;
      const maxAttempts = 5;

      try {
        // Handle HEIC files
        if (req.file.originalname.toLowerCase().endsWith('.heic')) {
          buffer = await sharp(filePath, { input: { failOn: 'none' } })
            .toFormat('jpeg')
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
        } else {
          buffer = await sharp(filePath)
            .resize({ width: 800, withoutEnlargement: true })
            .jpeg({ quality, mozjpeg: true })
            .toBuffer();
        }

        // Reduce quality until size < 100kb or quality < 30 or max attempts reached
        while (buffer.length > 100 * 1024 && quality >= 30 && attempts < maxAttempts) {
          quality -= 10;
          attempts++;
          
          if (req.file.originalname.toLowerCase().endsWith('.heic')) {
            buffer = await sharp(filePath, { input: { failOn: 'none' } })
              .toFormat('jpeg')
              .resize({ width: 800, withoutEnlargement: true })
              .jpeg({ quality, mozjpeg: true })
              .toBuffer();
          } else {
            buffer = await sharp(filePath)
              .resize({ width: 800, withoutEnlargement: true })
              .jpeg({ quality, mozjpeg: true })
              .toBuffer();
          }
        }

        // Save processed image
        await sharp(buffer).toFile(compressedFilePath);

        // Delete old image if exists
        if (updatedProduct.imageUrl) {
          const oldImagePath = path.join(__dirname, updatedProduct.imageUrl);
          if (fs.existsSync(oldImagePath)) {
            fs.unlinkSync(oldImagePath);
          }
        }
        updatedProduct.imageUrl = `/uploads/${req.file.filename}`;
      } catch (error) {
        // Clean up uploaded file if processing fails
        if (fs.existsSync(filePath)) {
          fs.unlinkSync(filePath);
        }
        throw error;
      }
    } else if (!updatedProduct.imageUrl) {
      return res.status(400).json({ success: false, message: "Product must have an image" });
    }

    // Parse ringSize if sent as JSON string
    let ringSizeData = {};
    if (req.body.ringSize) {
      try {
        ringSizeData = typeof req.body.ringSize === 'string' ? JSON.parse(req.body.ringSize) : req.body.ringSize;
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid ringSize format" });
      }
    }

    // Parse subcategories if sent as JSON string
    let subcategoriesData = [];
    if (req.body.subcategories) {
      try {
        subcategoriesData = typeof req.body.subcategories === 'string' ? JSON.parse(req.body.subcategories) : req.body.subcategories;
      } catch (e) {
        return res.status(400).json({ success: false, message: "Invalid subcategories format" });
      }
    }

    // Update all fields from JSON data
    const { name, price, mrp, discount, category, stock, description } = req.body;
    updatedProduct.name = name;
    updatedProduct.price = price;
    updatedProduct.mrp = mrp;
    updatedProduct.discount = discount;
    updatedProduct.category = category;
    updatedProduct.subcategories = subcategoriesData;
    updatedProduct.stock = category === "Rings" && ringSizeData
      ? Object.values(ringSizeData).reduce((acc, val) => acc + Number(val), 0)
      : stock;
    updatedProduct.description = description;
    updatedProduct.option = req.body.option;
    updatedProduct.ringSize = ringSizeData;
    updatedProduct.timestamp = new Date().toISOString();

    await updatedProduct.save();
    
    // Return all product fields in response
    const responseProduct = {
      _id: updatedProduct._id,
      name: updatedProduct.name,
      price: updatedProduct.price,
      mrp: updatedProduct.mrp,
      discount: updatedProduct.discount,
      category: updatedProduct.category,
      subcategories: updatedProduct.subcategories,
      stock: updatedProduct.stock,
      description: updatedProduct.description,
      option: updatedProduct.option,
      ringSize: updatedProduct.ringSize,
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
    console.error("Product update error:", error);
    res.status(500).json({ 
      success: false, 
      message: "Failed to update product", 
      error: error.message 
    });
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
    const { quantity, ringSize } = req.body;
    const product = await Product.findById(req.params.id);
    
    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    if (product.category === "Rings" && ringSize) {
      // Check if ringSize exists in product ringSize map
      if (!product.ringSize.has(ringSize)) {
        return res.status(400).json({ success: false, message: "Invalid ring size" });
      }
      if (product.ringSize.get(ringSize) < quantity) {
        return res.status(400).json({ success: false, message: "Insufficient stock available for this ring size" });
      }
      // Update ring size stock
      product.ringSize.set(ringSize, product.ringSize.get(ringSize) - quantity);
    } else {
      if (product.stock < quantity) {
        return res.status(400).json({ 
          success: false, 
          message: "Insufficient stock available" 
        });
      }
      product.stock -= quantity;
    }

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

app.get("/user/profile", authenticate, async (req, res) => {
  try {
    let user = await User.findOne({ email: req.user.email });
    let isNewUser = false;
    if (!user) {
      // Create new user record with email only
      user = new User({ email: req.user.email, cart: [], wishlist: [] });
      await user.save();
      isNewUser = true;
    }
    res.status(200).json({ success: true, user, isNewUser });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch user profile", error });
  }
});

app.put("/user/profile", authenticate, async (req, res) => {
  try {
    const { name, dob, address, phoneNumber, additionalPhoneNumber } = req.body;
    const user = await User.findOne({ email: req.user.email });
    if (!user) {
      return res.status(404).json({ success: false, message: "User not found" });
    }
    if (name) user.name = name;
    if (dob) user.dob = dob;
    if (address) user.address = address;
    if (phoneNumber) user.phoneNumber = phoneNumber;
    if (additionalPhoneNumber) user.additionalPhoneNumber = additionalPhoneNumber;

    await user.save();
    res.status(200).json({ success: true, message: "User profile updated", user });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to update user profile", error });
  }
});

// Endpoint to get bestsellers (public)
app.get("/bestsellers", async (req, res) => {
  try {
    const orders = await Order.find().sort({ createdAt: -1 });
    
    // Calculate product sales
    const productSales = {};
    
    orders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach(item => {
        if (!item.name || !item.productId) return;
        
        if (!productSales[item.name]) {
          productSales[item.name] = {
            name: item.name,
            quantity: 0,
            price: item.price || 0,
            mrp: item.mrp || item.price || 0,
            discount: item.discount || 0,
            imageUrl: item.imageUrl,
            productId: item.productId
          };
        }
        productSales[item.name].quantity += item.quantity || 0;
      });
    });
    
    // Sort and get top 20 products
    const top20Products = Object.values(productSales)
      .sort((a, b) => b.quantity - a.quantity)
      .slice(0, 20);
    
    res.json({ success: true, products: top20Products });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch bestsellers", error });
  }
});

// Endpoint to get product sales data for admin
app.get("/products/sales", verifyAdmin, async (req, res) => {
  try {
    // Get all orders
    const orders = await Order.find().sort({ createdAt: -1 });
    
    // Get all products
    const products = await Product.find().lean();
    
    // Calculate sales for each product
    const productSales = {};
    products.forEach(product => {
      productSales[product._id] = {
        ...product,
        totalSales: 0,
        totalRevenue: 0,
        totalQuantity: 0
      };
    });
    
    // Calculate sales from orders
    orders.forEach(order => {
      if (!order.items || !Array.isArray(order.items)) return;
      
      order.items.forEach(item => {
        if (!item.productId || !productSales[item.productId]) return;
        
        const product = productSales[item.productId];
        product.totalSales += 1;
        product.totalRevenue += (item.price * item.quantity);
        product.totalQuantity += item.quantity;
      });
    });
    
    // Convert to array and sort by total revenue
    const productsWithSales = Object.values(productSales)
      .sort((a, b) => b.totalRevenue - a.totalRevenue);
    
    res.json({ success: true, products: productsWithSales });
  } catch (error) {
    res.status(500).json({ success: false, message: "Failed to fetch product sales data", error });
  }
});

app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Server is running on http://0.0.0.0:${PORT}`);

  // Self-ping mechanism to keep the backend awake on Render free service
  const http = require('http');
  const pingInterval = 1 * 60 * 1000; // 5 minutes

  const pingServer = () => {
    const options = {
      hostname: 'localhost',
      port: PORT,
      path: '/ping',
      method: 'GET',
    };

    const req = http.request(options, (res) => {
      console.log(`Self-ping status code: ${res.statusCode}`);
    });

    req.on('error', (error) => {
      console.error(`Self-ping error: ${error.message}`);
    });

    req.end();
  };

  // Start pinging immediately and then at intervals
  pingServer();
  setInterval(pingServer, pingInterval);
});
