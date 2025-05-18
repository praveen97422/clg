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
import TodaysDeal from "./TodaysDeals.jsx";
import AboutUs from "./AboutUs.jsx";
import CartPage from "./CartPage.jsx";
import WishlistPage from "./WishlistPage.jsx";
import ProtectedRoute from "./auth/ProtectedRoute.jsx";
import AdminProtectedRoute from "./auth/AdminProtectedRoute.jsx";
import NewArrivals from "./NewArrivals.jsx";
import ShopBy from "./ShopBy.jsx";
import CheckoutPage from "./CheckoutPage.jsx";
import Collection from "./Collection.jsx";
import Categories from "./Categories.jsx";
import AllProducts from "./AllProducts.jsx";
import UserDetailsPage from "./auth/UserDetailsPage.jsx";
import UserOrdersPage from "./UserOrdersPage.jsx";
import AdminOrdersPage from "./AdminOrdersPage.jsx";
import AdminAnalytics from "./AdminAnalytics.jsx";
import Bestsellers from "./Bestsellers.jsx";
import NotFound from "./components/NotFound.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import usePageTitle from "./hooks/usePageTitle";
// import HandTracking from "./hand.jsx";
// import Footer from "./footer.jsx";
import "./App.css";
// import "./styles/HomePage.css";

function NavbarWrapper() {
  const location = useLocation();
  const { isAdmin } = useAuth();

  // Set page title based on current route
  usePageTitle(
    location.pathname === '/' ? 'Home' :
    location.pathname.startsWith('/admin') ? 'Admin Dashboard' :
    location.pathname.startsWith('/product') ? 'Product Details' :
    location.pathname.startsWith('/cart') ? 'Shopping Cart' :
    location.pathname.startsWith('/wishlist') ? 'Wishlist' :
    location.pathname.startsWith('/newarrivals') ? 'New Arrivals' :
    location.pathname.startsWith('/collection') ? 'Collection' :
    location.pathname.startsWith('/categories') ? 'Categories' :
    location.pathname.startsWith('/shopby') ? 'Shop By' :
    location.pathname.startsWith('/all-products') ? 'All Products' :
    location.pathname.startsWith('/checkout') ? 'Checkout' :
    location.pathname.startsWith('/Aboutus') ? 'About Us' :
    location.pathname.startsWith('/bestsellers') ? 'Bestsellers' :
    location.pathname.startsWith('/profile') ? 'My Profile' :
    'Perses'
  );

  if (location.pathname.startsWith('/admin')) {
    return <AdminNavbar />;
  }
  if (isAdmin) {
    return <Anavbar />;
  }
  return <Navbar />;
}

function HomePage() {
  return (
    <div className="home-page-container">
      <ImageSlider />
      <div className="home-content">
        <JewelryCards />
        <TodaysDeal />
        <Home />
      </div>
    </div>
  );
}

export default function AppRoutes() {
  return (
    <AuthProvider>
      <CartProvider>
        <WishlistProvider>
          <Router>
            <ScrollToTop />
            <NavbarWrapper />
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route 
                path="/admin" 
                element={
                  <AdminProtectedRoute>
                    <ProductManager />
                  </AdminProtectedRoute>
                } 
              />
              <Route path="/admin/orders" element={
                <AdminProtectedRoute>
                  <AdminOrdersPage />
                </AdminProtectedRoute>
              } />
              <Route path="/admin/analytics" element={
                <AdminProtectedRoute>
                  <AdminAnalytics />
                </AdminProtectedRoute>
              } />
              <Route path="/bestsellers" element={<Bestsellers />} />
              <Route path="/product/:id" element={<ProductDetails />} />
              <Route path="/cart" element={<CartPage />} />
              <Route path="/wishlist" element={<WishlistPage />} />
              <Route path="/newarrivals" element={<NewArrivals />} />
              <Route path="/collection" element={<Collection />} />
              <Route path="/categories" element={<Categories />} />
              <Route path="/shopby" element={<ShopBy />} />
              <Route path="/all-products" element={<AllProducts />} />
              <Route path="/checkout" element={<CheckoutPage />} />
              {/* <Route path="/Aboutus" element={<AboutUs />} /> */}
              <Route path="/bestsellers" element={<Bestsellers />} />
              {/* <Route path="/eye" element={<HandTracking />} /> */}
              <Route 
                path="/profile" 
                element={
                  <ProtectedRoute>
                    <UserDetailsPage />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/profile/orders" 
                element={
                  <ProtectedRoute>
                    <UserOrdersPage />
                  </ProtectedRoute>
                } 
              />
              {/* <Route path="/footer" element={<Footer />} /> */}

              {/* Catch-all route for 404 errors */}
              <Route path="*" element={<NotFound />} />
              
              
            </Routes>
          </Router>
        </WishlistProvider>
      </CartProvider>
    </AuthProvider>
  );
}
