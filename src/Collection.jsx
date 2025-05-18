import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, useLocation } from "react-router-dom"; // Import useLocation for query params
import "./styles/Home.css";
import { BASE_URL } from "./apiConfig.js";
import LazyImage from "./components/LazyImage";
import "./styles/LazyImage.css";

const CACHE_KEY = "cachedCollection";
const CACHE_TIMESTAMP_KEY = "cachedCollectionTimestamp";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const Collection = () => {
  const [products, setProducts] = useState([]);
  const [sortOption, setSortOption] = useState("default");
  const navigate = useNavigate();
  const location = useLocation();
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

  // Read category from query params
  const queryParams = new URLSearchParams(location.search);
  const categoryFilter = queryParams.get("category");

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

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  // Filter products by category if categoryFilter is set
  const filteredProducts = categoryFilter
    ? products.filter((product) => product.option === categoryFilter)
    : products;

  const sortedProducts = () => {
    let sorted = [...filteredProducts];
    switch (sortOption) {
      case "priceLowHigh":
        sorted.sort((a, b) => (a.mrp * (1 - a.discount / 100)) - (b.mrp * (1 - b.discount / 100)));
        break;
      case "priceHighLow":
        sorted.sort((a, b) => (b.mrp * (1 - b.discount / 100)) - (a.mrp * (1 - a.discount / 100)));
        break;
      case "nameAZ":
        sorted.sort((a, b) => a.name.localeCompare(b.name));
        break;
      case "nameZA":
        sorted.sort((a, b) => b.name.localeCompare(a.name));
        break;
      default:
        break;
    }
    return sorted;
  };

  const categorizedProducts = sortedProducts().reduce((acc, product) => {
    const category = product.option || "Others";
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  const handleClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } });
  };

  return (
    <div className="home-containers">
      <h2 className="section-title" style={{ paddingTop: "20px", paddingLeft: "20px" }}>
        {categoryFilter ? `Products in "${categoryFilter}"` : "Collection"}
      </h2>
      <div className="home-container">
        <div className="sort-container">
          <label htmlFor="sortSelect">Sort by:</label>
          <select id="sortSelect" value={sortOption} onChange={handleSortChange}>
            <option value="default">Default</option>
            <option value="priceLowHigh">Price: Low to High</option>
            <option value="priceHighLow">Price: High to Low</option>
            <option value="nameAZ">Name: A to Z</option>
            <option value="nameZA">Name: Z to A</option>
          </select>
        </div>
        {Object.keys(categorizedProducts).length === 0 ? (
          <p>No products available.</p>
        ) : (
          Object.keys(categorizedProducts).map((category) => (
            <div key={category} className="category-section">
              <h3 className="section-title">{category}</h3>
              <div className="product-grid">
                {categorizedProducts[category].map((product) => (
                  <div
                    key={product._id}
                    className="product-card"
                    onClick={() => handleClick(product)}
                  >
                    <div style={{ position: "relative" }}>
                      <LazyImage
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
                      {product.discount > 0 && (
                        <div className="product-discount-badge">
                          {product.discount}% OFF
                        </div>
                      )}
                    </div>
                    <div className="product-details">
                      <p className="product-name">{product.name}</p>
                      <p className="product-price">
                        <span
                          style={{ textDecoration: "line-through", color: "gray" }}
                        >
                          ₹{product.mrp}
                        </span>
                        <strong>
                          {" "}
                          ₹{(product.mrp * (1 - product.discount / 100)).toFixed(2)}
                        </strong>
                        
                        <span style={{ color: "green" }}>&#40;{product.discount}%&#41; </span>
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Collection;
