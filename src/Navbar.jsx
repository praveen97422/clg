import { FaSearch, FaHeart, FaShoppingBag, FaUser, FaBars, FaTimes, FaChevronDown } from "react-icons/fa";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import { useWishlist } from "./WishlistContext.jsx";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "./auth/AuthContext.jsx";
import LoginModal from "./auth/LoginModal.jsx";
import axios from "axios";
import { BASE_URL } from "./apiConfig.js";
import "./styles/Navbar.css"; // Import your CSS file for styling


export default function Navbar() {
  const { cart } = useCart();
  const { wishlist } = useWishlist();
  const { user, isAuthenticated, logout } = useAuth();
  const [showDropdown, setShowDropdown] = useState(false);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const [sidebarVisible, setSidebarVisible] = useState(false);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 900);
  const [searchTerm, setSearchTerm] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [searchHistory, setSearchHistory] = useState(() => {
    const saved = localStorage.getItem('searchHistory');
    return saved ? JSON.parse(saved) : [];
  });
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [suggestions, setSuggestions] = useState([]);
  const [showCollectionDropdown, setShowCollectionDropdown] = useState(false);
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
  const [products, setProducts] = useState([]);
  const [scrolled, setScrolled] = useState(false);
  const navigate = useNavigate();
  const searchBarRef = useRef(null);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/products`);
        setProducts(res.data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };
    fetchProducts();

    const handleScroll = () => {
      if (window.scrollY > 30) {
        setScrolled(true);
      } else {
        setScrolled(false);
      }
    };

    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth <= 900);
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);
  
  const toggleSidebar = () => {
      setSidebarVisible(!sidebarVisible);
  };

  const handleSearch = (term) => {
    setSearchTerm(term);
    if (term.length > 0) {
      // Generate suggestions based on product names and categories
      const productSuggestions = products
        .filter(product => 
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.category.toLowerCase().includes(term.toLowerCase()) ||
          product.option?.toLowerCase().includes(term.toLowerCase()) ||
          (product.name && product.name.toLowerCase().includes(term.toLowerCase()))
        )
        .map(product => ({
          type: 'product',
          id: product._id,
          name: product.name,
          category: product.category,
          option: product.option,
          imageUrl: product.imageUrl
        }));

      // Add category suggestions
      const categorySuggestions = Array.from(new Set(products.map(p => p.category)))
        .filter(category => category.toLowerCase().includes(term.toLowerCase()))
        .map(category => ({
          type: 'category',
          name: category
        }));

      setSuggestions([...productSuggestions, ...categorySuggestions].slice(0, 5));
      setShowSuggestions(true);

      // Filter results for the dropdown
      const results = products.filter(
        (product) =>
          product.name.toLowerCase().includes(term.toLowerCase()) ||
          product.category.toLowerCase().includes(term.toLowerCase()) ||
          product.option?.toLowerCase().includes(term.toLowerCase()) ||
          (product.name && product.name.toLowerCase().includes(term.toLowerCase()))
      );
      setSearchResults(results.slice(0, 5));
    } else {
      setSearchResults([]);
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => 
        prev < suggestions.length - 1 ? prev + 1 : prev
      );
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => prev > 0 ? prev - 1 : prev);
    } else if (e.key === 'Enter' && selectedIndex >= 0) {
      e.preventDefault();
      const selected = suggestions[selectedIndex];
      if (selected.type === 'product') {
        handleProductClick(selected.id);
      } else if (selected.type === 'category') {
        navigate(`/categories?category=${encodeURIComponent(selected.name)}`);
      }
    } else if (e.key === 'Escape') {
      setShowSuggestions(false);
      setSelectedIndex(-1);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    if (suggestion.type === 'product') {
      handleProductClick(suggestion.id);
    } else if (suggestion.type === 'category') {
      navigate(`/categories?category=${encodeURIComponent(suggestion.name)}`);
    }
    
    // Add to search history
    const newHistory = [suggestion.name, ...searchHistory.filter(h => h !== suggestion.name)].slice(0, 5);
    setSearchHistory(newHistory);
    localStorage.setItem('searchHistory', JSON.stringify(newHistory));
  };

  const clearSearchHistory = () => {
    setSearchHistory([]);
    localStorage.removeItem('searchHistory');
  };

  const handleProductClick = (productId) => {
    setSearchTerm("");
    setSearchResults([]);
    navigate(`/product/${productId}`);
  };
  const categories = Array.from(new Set(products.map(p => p.option))).slice(0, 4);  
  const categoryOptions = Array.from(new Set(products.map(p => p.category)));

  // Create a map of categories to their subcategories
  const categorySubcategories = products.reduce((acc, product) => {
    if (product.category && product.subcategories) {
      if (!acc[product.category]) {
        acc[product.category] = new Set();
      }
      product.subcategories.forEach(subcat => acc[product.category].add(subcat));
    }
    return acc;
  }, {});

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (searchBarRef.current && !searchBarRef.current.contains(event.target)) {
        setShowSuggestions(false);
        setSelectedIndex(-1);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <div>
      {/* Top Banner */}
      <div className="top-banner">
        <marquee>BUY 3 GET 1 FREE | Use Code: <span className="promo-code">1234</span></marquee>
      </div>
      <div>
      <div className={`navbar-container${scrolled ? " navbar-scrolled" : ""}`}>
        {isMobile && (<FaBars className="hamburger-icon" onClick={toggleSidebar} />)}
        
        
        
        {/* Logo */}
        <h1 className="logo">
          <Link to="/" style={{ textDecoration: "none" ,color:"black"}}>Perses</Link>
        </h1>
        
        {/* Search Bar */}
        <div className="search-bar" ref={searchBarRef}>
          <input
            type="text"
            placeholder="Search Gifts for your dearest..."
            value={searchTerm}
            onChange={(e) => handleSearch(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setShowSuggestions(true)}
          />
          <FaSearch className="search-icon" />
          
          {showSuggestions && (searchTerm.length > 0 || searchHistory.length > 0) && (
            <div className="search-results">
              {searchTerm.length === 0 && searchHistory.length > 0 && (
                <div className="search-history">
                  <div className="search-history-header">
                    <span>Recent Searches</span>
                    <button onClick={clearSearchHistory} className="clear-history">Clear</button>
                  </div>
                  {searchHistory.map((term, index) => (
                    <div
                      key={index}
                      className="search-history-item"
                      onClick={() => handleSearch(term)}
                    >
                      <FaSearch className="search-history-icon" />
                      <span>{term}</span>
                    </div>
                  ))}
                </div>
              )}
              
              {suggestions.map((suggestion, index) => (
                <div
                  key={index}
                  className={`search-result-item ${index === selectedIndex ? 'selected' : ''}`}
                  onClick={() => handleSuggestionClick(suggestion)}
                >
                  {suggestion.type === 'product' ? (
                    <>
                      <img
                        src={`${BASE_URL}${suggestion.imageUrl}`}
                        alt={suggestion.name}
                        className="search-result-image"
                      />
                      <div className="search-result-details">
                        <p className="search-result-name">{suggestion.name}</p>
                        <p className="search-result-category">{suggestion.category}</p>
                        {suggestion.option && (
                          <p className="search-result-option">{suggestion.option}</p>
                        )}
                      </div>
                    </>
                  ) : (
                    <div className="search-result-details">
                      <p className="search-result-category">
                        <FaSearch className="category-icon" />
                        Search in {suggestion.name}
                      </p>
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
        
        {/* Icons */}
        <div className="nav-icons">
          <div
            className="profile-icon"
            onMouseEnter={() => !isMobile && setShowDropdown(true)}
            onMouseLeave={() => !isMobile && setShowDropdown(false)}
            onClick={() => isMobile && setShowDropdown(!showDropdown)}
          >
            <FaUser/>
            {showDropdown && (
  <div className="profile-dropdown">
{isAuthenticated ? (
  <>
    <div 
      className="dropdown-item user-profile-info" 
      onClick={() => {
        setShowDropdown(false);
        navigate("/profile");
      }}
    >
      {user?.picture && (
        <img
          src={user.picture}
          alt="User Profile"
          className="user-profile-picture"
        />
      )}
      <span>Hi, {user?.name}</span>
    </div>
    <div className="dropdown-item" onClick={() => { setShowDropdown(false); navigate("/profile/orders"); }}>My Orders</div>
    <div className="dropdown-item" onClick={logout}>Logout</div>
  </>
) : (
  <div className="dropdown-item" onClick={() => setShowLoginModal(true)}>Login</div>
)}
  </div>
)}
          </div>
          <Link to="/wishlist" className="wishlist-icon">
            <FaHeart />
              {wishlist.length > 0 && <span className="wishlist-count">{wishlist.length}</span>}
          </Link>
          <Link to="/cart" className="cart-icon">
            <FaShoppingBag />
              {cart.length > 0 && <span className="cart-count">{cart.length}</span>}
          </Link>
        </div>
      </div>

      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}

      {/* Mobile Sidebar */}
      {isMobile && (
        <div className={`mobile-sidebar ${sidebarVisible ? 'open' : ''}`}>
          <div className="sidebar-header">
            <FaTimes className="sidebar-close-btn" onClick={toggleSidebar} />
          </div>
          <div className="mobile-nav-menu">
            {/* Mobile Profile Section */}
            <div className="mobile-profile-section">
              {isAuthenticated ? (
                <>
                  <div className="mobile-profile-info mobile-nav-link" onClick={() => {
                    setShowDropdown(false);
                    navigate("/profile");
                    toggleSidebar();
                  }}>
                    {user?.picture && (
                      <img
                        src={user.picture}
                        alt="User Profile"
                        className="mobile-user-profile-picture"
                      />
                    )}
                    <span>Hi, {user?.name}</span>
                  </div>
                  <Link to="/profile/orders" onClick={toggleSidebar} className="mobile-nav-links">My Orders</Link>
                  <div onClick={() => { logout(); toggleSidebar(); }} className="mobile-nav-links">Logout</div>
                </>
              ) : (
                <div onClick={() => { setShowLoginModal(true); toggleSidebar(); }} className="mobile-nav-link">Login</div>
              )}
            </div>

            {/* Navigation Links */}
            <Link to="/" onClick={toggleSidebar} className="mobile-nav-link">Home</Link>
            {/* <Link to="/Aboutus" onClick={toggleSidebar} className="mobile-nav-link">About Us</Link> */}
            <Link to="/newarrivals" onClick={toggleSidebar} className="mobile-nav-link">New Arrivals</Link>
            <Link to="/bestsellers" onClick={toggleSidebar} className="mobile-nav-link">Bestsellers</Link>

            {/* Mobile Collection Dropdown */}
            <div className="mobile-nav-link mobile-dropdown-header" onClick={() => setShowCollectionDropdown(!showCollectionDropdown)}>
              <span>Collection</span>
              <FaChevronDown className={`dropdown-arrow ${showCollectionDropdown ? 'rotate' : ''}`} />
            </div>
            {showCollectionDropdown && (
              <div className="mobile-dropdown-content">
                {categories.map((category) => (
                  <Link
                    key={category}
                    to={`/Collection?category=${encodeURIComponent(category)}`}
                    onClick={toggleSidebar}
                    className="mobile-nav-link"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}

            {/* Mobile Categories Dropdown */}
            <div className="mobile-nav-link mobile-dropdown-header" onClick={() => setShowCategoryDropdown(!showCategoryDropdown)}>
              <span>Categories</span>
              <FaChevronDown className={`dropdown-arrow ${showCategoryDropdown ? 'rotate' : ''}`} />
            </div>
            {showCategoryDropdown && (
              <div className="mobile-dropdown-content">
                {categoryOptions.map((category) => (
                  <div key={category} className="mobile-category-group">
                    <Link
                      to={`/categories?category=${encodeURIComponent(category)}`}
                      onClick={toggleSidebar}
                      className="mobile-nav-link"
                    >
                      {category}
                    </Link>
                    {categorySubcategories[category] && (
                      <div className="mobile-subcategories">
                        {Array.from(categorySubcategories[category]).map((subcat) => (
                          <Link
                            key={subcat}
                            to={`/categories?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcat)}`}
                            onClick={toggleSidebar}
                            className="mobile-nav-link"
                          >
                            {subcat}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}

            {/* <Link to="/ShopBy" onClick={toggleSidebar} className="mobile-nav-link">Shop By</Link> */}
            {/* <Link to="/" onClick={toggleSidebar} className="mobile-nav-link">Gifting</Link> */}
            <Link to="/All-products" onClick={toggleSidebar} className="mobile-nav-link">All Products</Link>

            {/* Mobile Wishlist and Cart */}
            <div className="mobile-account-links">
              <Link to="/wishlist" onClick={toggleSidebar} className="mobile-account-item">
                <FaHeart />
                <span>Wishlist</span>
                {wishlist.length > 0 && <span className="mobile-count">{wishlist.length}</span>}
              </Link>
              <Link to="/cart" onClick={toggleSidebar} className="mobile-account-item">
                <FaShoppingBag />
                <span>Cart</span>
                {cart.length > 0 && <span className="mobile-count">{cart.length}</span>}
              </Link>
            </div>
          </div>
        </div>
      )}

      {/* Desktop Navigation Menu */}
      {!isMobile && (
        <div className="nav-menu">
          <Link to="/">Home</Link>
          <Link to="/newarrivals">New Arrivals</Link>
          <Link to="/bestsellers">Bestsellers</Link>
          
          {/* Collection Dropdown */}
          <div
            className="collection-dropdown"
            onMouseEnter={() => setShowCollectionDropdown(true)}
            onMouseLeave={() => setShowCollectionDropdown(false)}
          >
            <Link to="/Collection">Collection</Link>
            {showCollectionDropdown && (
              <div className="dropdown-menu">
                {categories.map((category) => (
                  <Link
                    key={category}
                    to={`/Collection?category=${encodeURIComponent(category)}`}
                    className="dropdown-item"
                  >
                    {category}
                  </Link>
                ))}
              </div>
            )}
          </div>

          {/* Categories Dropdown */}
          <div
            className="category-dropdown"
            onMouseEnter={() => setShowCategoryDropdown(true)}
            onMouseLeave={() => setShowCategoryDropdown(false)}
          >
            <Link to="/categories">Categories</Link>
            {showCategoryDropdown && (
              <div className="dropdown-menu">
                {categoryOptions.map((category) => (
                  <div key={category} className="category-group">
                    <Link
                      to={`/categories?category=${encodeURIComponent(category)}`}
                      className="dropdown-item"
                    >
                      {category}
                    </Link>
                    {categorySubcategories[category] && (
                      <div className="subcategories">
                        {Array.from(categorySubcategories[category]).map((subcat) => (
                          <Link
                            key={subcat}
                            to={`/categories?category=${encodeURIComponent(category)}&subcategory=${encodeURIComponent(subcat)}`}
                            className="subcategory-item"
                          >
                            {subcat}
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* <Link to="/ShopBy">Shop By</Link> */}
          {/* <Link to="/">Gifting</Link> */}
          <Link to="/All-products">All Products</Link>
          {/* <Link to="/Aboutus">About Us</Link> */}
        </div>
      )}
      </div>
      </div>
      
  );
}
