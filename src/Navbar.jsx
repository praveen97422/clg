import { FaSearch, FaHeart, FaShoppingBag, FaUser } from "react-icons/fa";
import { Link } from "react-router-dom";
import "./styles/Navbar.css";
import { useCart } from "./CartContext.jsx";

export default function Navbar() {
  const { cart } = useCart();
    
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
          <FaUser />
          <FaHeart />
          <Link to="/cart" className="cart-icon">
            <FaShoppingBag />
            {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
          </Link>
        </div>
      </div>

      {/* Navigation Menu */}
      <div className="nav-menu">
        <Link to="/">New Arrivals</Link>
        <Link to="/">Best Seller</Link>
        <Link to="/">Collection</Link>
        <Link to="/">Shop By</Link>
        <Link to="/">Gifting</Link>
        {/* <Link to="/">Return & Exchange</Link> */}
        <Link to="/">About Us</Link>
        <Link to="/admin" className="admin-link">Admin</Link>
      </div>
    </div>
  );
}
