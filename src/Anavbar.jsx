import { FaSearch, FaHeart, FaShoppingBag, FaUser } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import "./styles/Navbar.css";
import { useCart } from "./CartContext.jsx";
import { useState, useEffect } from "react";
import { useAuth } from "./auth/AuthContext.jsx";
import LoginModal from "./auth/LoginModal.jsx";
import axios from "axios";

export default function Navbar() {
  const { cart } = useCart();
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [products, setProducts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/products");
        setProducts(res.data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();
  }, []);

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.length > 0) {
      const results = products.filter(
        (product) =>
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.category.toLowerCase().includes(term.toLowerCase())
      );
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
    }
  };

  const handleProductClick = (productId) => {
    setSearchTerm("");
    setSearchResults([]);
    navigate(`/product/${productId}`);
  };
    
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
          <input
            type="text"
            placeholder="Search Gifts for your dearest..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
          />
          <FaSearch className="search-icon" />
          {searchResults.length > 0 && (
            <div className="search-results">
              {searchResults.map((product) => (
                <div
                  key={product._id}
                  className="search-result-item"
                  onClick={() => handleProductClick(product._id)}
                >
                  <img
                    src={`http://localhost:5000${product.imageUrl}`}
                    alt={product.name}
                    className="search-result-image"
                  />
                  <div className="search-result-details">
                    <p className="search-result-name">{product.name}</p>
                    <p className="search-result-category">{product.category}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
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
        <Link to="admin">Admin</Link>
        <Link to="/">About Us</Link>
      </div>
    </div>
  );
}
