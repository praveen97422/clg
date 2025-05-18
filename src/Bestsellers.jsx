import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "./apiConfig.js";
import { Link } from "react-router-dom";
import "./styles/Home.css";
import LazyImage from "./components/LazyImage";
import "./styles/LazyImage.css";

const CACHE_KEY = "cachedBestsellers";
const CACHE_TIMESTAMP_KEY = "cachedBestsellersTimestamp";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

export default function Bestsellers() {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [topProducts, setTopProducts] = useState([]);
  const [sortOption, setSortOption] = useState("bestsellers");
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

  const fetchBestsellers = async () => {
    try {
      // Check if we're offline first
      if (!isOnline) {
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          setTopProducts(JSON.parse(cachedData));
          setLoading(false);
          return;
        }
      }

      // If online, try to fetch new data
      const response = await axios.get(`${BASE_URL}/bestsellers`);
      
      if (!response.data || !response.data.success) {
        throw new Error("Failed to fetch bestsellers data");
      }

      // Fetch product details to get correct image URLs
      const productIds = response.data.products.map(p => p.productId);
      const productsResponse = await axios.get(`${BASE_URL}/products`);
      
      if (!productsResponse.data || !productsResponse.data.success) {
        throw new Error("Failed to fetch product details");
      }

      // Create a map of product details
      const productDetails = {};
      productsResponse.data.products.forEach(product => {
        productDetails[product._id] = product;
      });

      const newProducts = response.data.products.map(p => ({
        ...p,
        ...productDetails[p.productId]
      }));

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
          setTopProducts(newProducts);
          localStorage.setItem(CACHE_KEY, JSON.stringify(newProducts));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
        } else if (now - cachedTimestamp < CACHE_DURATION) {
          // If data hasn't changed and cache is still valid, use cached data
          setTopProducts(cachedProducts);
        } else {
          // If cache is expired, use new data
          setTopProducts(newProducts);
          localStorage.setItem(CACHE_KEY, JSON.stringify(newProducts));
          localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
        }
      } else {
        // No cache exists, use new data
        setTopProducts(newProducts);
        localStorage.setItem(CACHE_KEY, JSON.stringify(newProducts));
        localStorage.setItem(CACHE_TIMESTAMP_KEY, now.toString());
      }
      setLoading(false);
    } catch (error) {
      console.error("Error fetching bestsellers:", error);
      setError(error.message);
      // If there's an error, try to use cached data as fallback
      const cachedData = localStorage.getItem(CACHE_KEY);
      if (cachedData) {
        setTopProducts(JSON.parse(cachedData));
      }
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchBestsellers();
  }, [isOnline]); // Re-run when online status changes

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const sortedProducts = () => {
    let sorted = [...topProducts];
    switch (sortOption) {
      case "bestsellers":
        // Keep original order from API for bestsellers
        break;
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
        // Default sort by newest first (timestamp or createdAt descending)
        sorted.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
        break;
    }
    return sorted;
  };

  if (loading) return <div className="bestsellers-container">Loading bestsellers...</div>;
  if (error) return <div className="bestsellers-container error">{error}</div>;

  return (
    <div className="bestsellers-container home-container home-containers">
      <h2 className="section-title">Top Bestsellers</h2>
      <div className="sort-container" style={{ marginBottom: "1rem" }}>
        <label htmlFor="sortSelect" style={{ marginRight: "0.5rem" }}>Sort by:</label>
        <select id="sortSelect" value={sortOption} onChange={handleSortChange}>
          <option value="bestsellers">Default</option>
          <option value="newarrivals">New Arrivals</option>
          <option value="priceLowHigh">Price: Low to High</option>
          <option value="priceHighLow">Price: High to Low</option>
          <option value="nameAZ">Name: A to Z</option>
          <option value="nameZA">Name: Z to A</option>
        </select>
      </div>
      <div className="product-grid">
        {sortedProducts().map((product, index) => (
          <div 
            key={index} 
            className="product-card"
            onClick={() => window.location.href = `/product/${product.productId}`}
          >
            <div style={{ position: "relative" }}>
              <LazyImage 
                src={product.imageUrl.startsWith('http') ? product.imageUrl : `${BASE_URL}${product.imageUrl}`}
                alt={product.name}
                className="product-image"
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
                <span style={{ textDecoration: "line-through", color: "gray" }}>
                  ₹{product.mrp}
                </span>
                <strong> ₹{(product.mrp * (1 - product.discount / 100)).toFixed(2)}</strong>
                {product.discount > 0 && (
                  <span style={{ color: "green" }}>&#40;{product.discount}%&#41; </span>
                )}
              </p>
              <p className="product-sales">{product.quantity} sold</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
