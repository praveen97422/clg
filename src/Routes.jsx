import React from "react";
import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { CartProvider } from "./CartContext.jsx";
import { WishlistProvider } from "./WishlistContext.jsx";
import { AuthProvider } from "./auth/AuthContext.jsx";
import Navbar from "./Navbar.jsx";
import AdminNavbar from "./AdminNavbar.jsx";
import Anavbar from "./Anavbar.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import ImageSlider from "./ImageSlider.jsx";
import JewelryCards from "./SectionSelection.jsx";
import ProductDetails from "./ProductDetails.jsx";
import ProductManager from "./ProductManagement.jsx";
import Home from "./Home.jsx";
import CartPage from "./CartPage.jsx";
import WishlistPage from "./WishlistPage.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AdminProtectedRoute from "./auth/AdminProtectedRoute.jsx";
import NewArrivals from "./NewArrivals.jsx";
import ShopBy from "./ShopBy.jsx";
import Footer from "./Footer.jsx";

function NavbarWrapper() {
  const location = useLocation();
  const { isAdmin } = useAuth();

  if (location.pathname.startsWith('/admin')) {
    return <AdminNavbar />;
  }
  if (isAdmin) {
    return <Anavbar />;
  }
  return <Navbar />;
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <NavbarWrapper />
            <Routes>
              <Route path="/" element={<><ImageSlider /><JewelryCards /><Home /></>} />
              <Route 
                path="/admin" 
                element={
                  <AdminProtectedRoute>
                    <ProductManager />
                  </AdminProtectedRoute>
                } 
              />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/newarrivals" element={<NewArrivals />} />
              <Route path="/shopby" element={<ShopBy />} />
            </Routes>
            {/* <Footer /> */}
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
