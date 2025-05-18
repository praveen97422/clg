import React, { useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "./apiConfig.js";
import { useNavigate } from "react-router-dom";
import "./styles/Home.css";
import LazyImage from "./components/LazyImage";
import "./styles/LazyImage.css";

const CACHE_KEY = "cachedAllProducts";
const CACHE_TIMESTAMP_KEY = "cachedAllProductsTimestamp";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const AllProducts = () => {
  const [products, setProducts] = useState([]);
  const [sortOption, setSortOption] = useState("default");
  const navigate = useNavigate();
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

  const handleClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } });
  };

  const handleSortChange = (e) => {
    setSortOption(e.target.value);
  };

  const sortedProducts = () => {
    let sorted = [...products];
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

  return (
    <div className="home-container home-containers">
      <h2 className="section-title">All Products</h2>
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
      {products.length === 0 ? (
        <p>No products available.</p>
      ) : (
        <div className="product-grid">
          {sortedProducts().map((product) => (
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
                  <span style={{ textDecoration: "line-through", color: "gray" }}>
                    ₹{product.mrp}
                  </span>
                  <strong> ₹{(product.mrp * (1 - product.discount / 100)).toFixed(2)}</strong>
                  &#40;<span style={{ color: "green" }}>{product.discount}%&#41; </span>
                </p>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default AllProducts;
