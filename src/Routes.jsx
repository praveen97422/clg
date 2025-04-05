import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./CartContext.jsx";
import Navbar from "./navbar.jsx";
import ImageSlider from "./ImageSlider.jsx";
import JewelryCards from "./JewelryCards.jsx";
import ProductDetails from "./ProductDetails.jsx"; // Import the ProductDetails component
import ProductManager from "./ProductManagement.jsx";
import Home from "./Home.jsx";
import CartPage from "./CartPage.jsx";

export default function AppRoutes() {
  return (
    <CartProvider>
      <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<><ImageSlider /><JewelryCards /><Home /></>} /> {/* Updated to render only Home */}
        <Route path="/admin" element={<ProductManager />} />
        <Route path="/product/:id" element={<ProductDetails />} />
        <Route path="/cart" element={<CartPage />} />
      </Routes>
      </Router>
    </CartProvider>
  );
}
