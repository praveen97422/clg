import React from "react";
import "./styles/Home.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "./apiConfig.js";
import LazyImage from "./components/LazyImage";
import "./styles/LazyImage.css";

const CACHE_KEY = "cachedNewArrivals";
const CACHE_TIMESTAMP_KEY = "cachedNewArrivalsTimestamp";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const NewArrivals = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortOption, setSortOption] = useState("default");
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
            setLoading(false);
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
        setLoading(false);
      } catch (error) {
        console.error("Error fetching products:", error);
        // If there's an error, try to use cached data as fallback
        const cachedData = localStorage.getItem(CACHE_KEY);
        if (cachedData) {
          setProducts(JSON.parse(cachedData));
        }
        setLoading(false);
      }
    };
    fetchProducts();
  }, [isOnline]); // Re-run when online status changes

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
        // Default sort by newest first (timestamp or createdAt descending)
        sorted.sort((a, b) => new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt));
        break;
    }
    return sorted;
  };

  const groupProductsByTime = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    const sorted = sortedProducts();

    return {
      thisWeek: sorted.filter(p => new Date(p.timestamp || p.createdAt) > oneWeekAgo),
      thisMonth: sorted.filter(p => new Date(p.timestamp || p.createdAt) > oneMonthAgo && 
                                     new Date(p.timestamp || p.createdAt) <= oneWeekAgo),
      older: sorted.filter(p => new Date(p.timestamp || p.createdAt) <= oneMonthAgo)
    };
  };

  const { thisWeek, thisMonth, older } = groupProductsByTime();

  if (loading) return <div className="home-container">Loading...</div>;

  return (
    <div className="home-container home-containers">
      <div className="sort-container">
        <label htmlFor="sortSelect">Sort by:</label>
        <select id="sortSelect" value={sortOption} onChange={handleSortChange}>
          <option value="default">Default (Newest)</option>
          <option value="priceLowHigh">Price: Low to High</option>
          <option value="priceHighLow">Price: High to Low</option>
          <option value="nameAZ">Name: A to Z</option>
          <option value="nameZA">Name: Z to A</option>
        </select>
      </div>
      {thisWeek.length > 0 && (
        <section>
          <h2 className="section-title">New This Week</h2>
          <div className="product-grid">
            {thisWeek.map((product) => (
              <ProductCard key={product._id} product={product} navigate={navigate} />
            ))}
          </div>
        </section>
      )}

      {thisMonth.length > 0 && (
        <section>
          <h2 className="section-title">New This Month</h2>
          <div className="product-grid">
            {thisMonth.map((product) => (
              <ProductCard key={product._id} product={product} navigate={navigate} />
            ))}
          </div>
        </section>
      )}

      {older.length > 0 && (
        <section>
          <h2 className="section-title">Older Arrivals</h2>
          <div className="product-grid">
            {older.map((product) => (
              <ProductCard key={product._id} product={product} navigate={navigate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const ProductCard = ({ product, navigate }) => {
  const handleClick = () => {
    console.log('Navigating to product:', product._id);
    console.log('Product data:', product);
    try {
      navigate(`/product/${product._id}`, { state: { product } });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div 
      className="product-card" 
      onClick={handleClick}
    >
      <div style={{ position: "relative" }}>
        <LazyImage 
          src={`${BASE_URL}${product.imageUrl}`} 
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
  );
};

export default NewArrivals;

