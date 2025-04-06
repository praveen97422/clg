import { FaSearch, FaHeart, FaShoppingBag, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./styles/Navbar.css";
import { useCart } from "./CartContext.jsx";
import { useState } from "react";
import { useAuth } from "./auth/AuthContext.jsx";
import LoginModal from "./auth/LoginModal.jsx";

export default function Navbar() {
  const { cart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
    
  return (
    <div>
      {/* Top Banner */}
      <div className="top-banner">
        <marquee>BUY 3 GET 1 FREE | Use Code: <span className="promo-code">1234</span></marquee>
      </div>

      {/* Navbar Section */}
      <div className="navbar-container">
        {/* Logo */}
        <h1 className="logo">
          <Link to="/">Havya Jewels</Link>
        </h1>
        
        {/* Search Bar */}
        <div className="search-bar">
          <input type="text" placeholder="Search Gifts for your dearest..." />
          <FaSearch className="search-icon" />
        </div>
        
        {/* Icons */}
        <div className="nav-icons">
          <div className="profile-icon" onClick={() => setShowDropdown(!showDropdown)}>
            <FaUser />
            {showDropdown && (
              <div className="profile-dropdown">
                {isAuthenticated ? (
                  <>
                    <div className="dropdown-item">Hi, {user?.name}</div>
                    <div className="dropdown-item" onClick={logout}>Logout</div>
                  </>
                ) : (
                  <div className="dropdown-item" onClick={() => setShowLoginModal(true)}>Login</div>
                )}
              </div>
            )}
          </div>
          <FaHeart />
          <Link to="/cart" className="cart-icon">
            <FaShoppingBag />
            {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
          </Link>
        </div>
      </div>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* Navigation Menu */}
      <div className="nav-menu">
        <Link to="/">Home</Link>
        <Link to="/newarrivals">New Arrivals</Link>
        <Link to="/">Best Seller</Link>
        <Link to="/">Collection</Link>
        <Link to="/ShopBy">Shop By</Link>
        <Link to="/">Gifting</Link>
        {/* <Link to="/">Return & Exchange</Link> */}
        <Link to="/">About Us</Link>
        <Link to="/admin" className="admin-link">Admin</Link>
      </div>
    </div>
  );
}
