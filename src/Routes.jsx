import React from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { CartProvider } from "./CartContext.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import Navbar from "./Navbar.jsx";
import ImageSlider from "./ImageSlider.jsx";
import JewelryCards from "./SectionSelection.jsx";
import ProductDetails from "./ProductDetails.jsx";
import ProductManager from "./ProductManagement.jsx";
import Home from "./Home.jsx";
import CartPage from "./CartPage.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import NewArrivals from "./NewArrivals.jsx";
import ShopBy from "./ShopBy.jsx";

export default function AppRoutes() {
  return (
    <AuthProvider>
      <CartProvider>
        <Router>
          <Navbar />
          <Routes>
            <Route path="/" element={<><ImageSlider /><JewelryCards /><Home /></>} />
            <Route 
              path="/admin" 
              element={
                <ProtectedRoute>
                  <ProductManager />
                </ProtectedRoute>
              } 
            />
            <Route path="/product/:id" element={<ProductDetails />} />
            <Route path="/cart" element={<CartPage />} />
            <Route path="/newarrivals" element={<NewArrivals />} />
            <Route path="/shopby" element={<ShopBy />} />
          </Routes>
        </Router>
      </CartProvider>
    </AuthProvider>
  );
}
