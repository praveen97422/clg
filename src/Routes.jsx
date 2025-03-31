import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import ImageSlider from "./ImageSlider.jsx";
import JewelryCards from "./JewelryCards.jsx";
import ProductDetails from "./ProductDetails.jsx"; // Import the ProductDetails component
import ProductManager from "./ProductManagement.jsx";
import Home from "./Home.jsx";

export default function AppRoutes() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<><ImageSlider /><Home /></>} /> {/* Updated to render only Home */}
        <Route path="/admin" element={<ProductManager />} />
        <Route path="/product/:id" element={<ProductDetails />} /> {/* Add route for product details */}
      </Routes>
    </Router>
  );
}
