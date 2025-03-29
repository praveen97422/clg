import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import Navbar from "./Navbar.jsx";
import ImageSlider from "./ImageSlider.jsx";
import JewelryCards from "./JewelryCards.jsx";
import ProductManager from "./ProductManager.jsx";
import Home from "./Home.jsx";

export default function AppRoutes() {
  return (
    <Router>
      <Navbar />
      <Routes>
        <Route path="/" element={<><ImageSlider /><JewelryCards /><Home /></>} />
        <Route path="/admin" element={<ProductManager />} />
      </Routes>
    </Router>
  );
}
