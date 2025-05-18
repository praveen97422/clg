import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import { BASE_URL } from "./apiConfig";
// import React, { useEffect, useState } from "react";
// import axios from "axios";
// import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
// import { BASE_URL } from "./apiConfig";
import "./styles/Home.css";

const CACHE_KEY = "cachedProducts";
const CACHE_TIMESTAMP_KEY = "cachedProductsTimestamp";
const CACHE_DURATION = 30 * 24 * 60 * 60 * 1000; // 30 days in milliseconds

const FEATURED_CATEGORIES = ['earrings', 'rings', 'bracelets', "kada's"];

const Home = () => {
    
  const [products, setProducts] = useState([]);
  const navigate = useNavigate(); // Initialize useNavigate
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  // Listen for online/offline status changes
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Check if we're offline first
        if (!isOnline) {
          const cachedData = localStorage.getItem(CACHE_KEY);
          if (cachedData) {
            setProducts(JSON.parse(cachedData));
            return;
          }
        }

        // If online, try to fetch new data
        const res = await axios.get(`${BASE_URL}/products`);
        const newProducts = res.data.products;

        const cachedData = localStorage.getItem(CACHE_KEY);
        const cachedTimestamp = localStorage.getItem(CACHE_TIMESTAMP_KEY);
        const now = new Date().getTime();

        if (cachedData) {
          const cachedProducts = JSON.parse(cachedData);
          
          // Check if data has changed
          const hasDataChanged = newProducts.length !== cachedProducts.length || 
            JSON.stringify(newProducts) !== JSON.stringify(cachedProducts);

          if (hasDataChanged) {
            // If data has changed, update cache regardless of duration
            setProducts(newProducts);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newProducts));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
          } else if (now - cachedTimestamp < CACHE_DURATION) {
            // If data hasn't changed and cache is still valid, use cached data
            setProducts(cachedProducts);
          } else {
            // If cache is expired, use new data
            setProducts(newProducts);
            localStorage.setItem(CACHE_KEY, JSON.stringify(newProducts));
            localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
          }
        } else {
          // No cache exists, use new data
          setProducts(newProducts);
          localStorage.setItem(CACHE_KEY, JSON.stringify(newProducts));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
        }
      } catch (error) {
        console.error("Error fetching products:", error);
        // If there's an error, try to use cached data as fallback
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          setProducts(JSON.parse(cachedData));
        }
      }
    };

    fetchProducts();
  }, [isOnline]); // Re-run when online status changes

  const categorizedProducts = products.reduce((acc, product) => {
    const category = product.category?.toLowerCase() || "Others";
    if (FEATURED_CATEGORIES.includes(category)) {
      if (!acc[category]) {
        acc[category] = [];
      }
      acc[category].push(product);
    }
    return acc;
  }, {});

  const handleClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } }); // Navigate to product details page
  };

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <h1>Timeless Elegance</h1>
          <p>Discover our exquisite collection of handcrafted jewelry</p>
          <button className="cta-button" onClick={() => navigate('/collection')}>
            Explore Collection
          </button>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-products">
        <h2>Featured Collections</h2>
        {Object.keys(categorizedProducts).map((category) => {
          const shuffledProducts = [...categorizedProducts[category]]
            .sort(() => 0.5 - Math.random())
            .slice(0, 4);
          return (
            <div key={category} className="category-section">
              <h3 className="section-title">{category}</h3>
              <div className="product-grid">
                {shuffledProducts.map((product) => (
                  <div key={product._id} className="product-card" onClick={() => handleClick(product)}>
                    <img 
                      className="product-image" 
                      src={`${BASE_URL}${product.imageUrl}`} 
                      alt={product.name}
                      onError={(e) => {
                        if (!e.target.src.includes("placeholder.jpg")) {
                          e.target.onerror = null;
                          e.target.src = "/placeholder.jpg";
                        }
                      }}
                    />
                    <div className="product-overlay">
                      <button className="view-details">View Details</button>
                    </div>
                    <div className="product-details">
                      <p className="product-name">{product.name}</p>
                      <p className="product-price">
                        <span style={{ textDecoration: 'line-through', color: 'gray' }}>₹{product.mrp}</span>
                        <strong style={{ color: '' }}> ₹{(product.mrp * (1 - product.discount / 100)).toFixed(2)}</strong>
                        <span style={{ color: 'green' }}>&#40;{product.discount}%&#41; </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </section>
    </div>
  );
};

export default Home;
