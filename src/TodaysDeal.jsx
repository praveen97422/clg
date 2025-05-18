import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate, Link } from "react-router-dom";
import { BASE_URL } from "./apiConfig";
import "./styles/TodaysDeal.css";

const CACHE_KEY = "cachedTodaysDeals";
const CACHE_TIMESTAMP_KEY = "cachedTodaysDealsTimestamp";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

const TodaysDeal = () => {
  const [products, setProducts] = useState([]);
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        // Always fetch new data first
        const res = await axios.get(`${BASE_URL}/products`);
        const newProducts = res.data.products
          .sort((a, b) => b.discount - a.discount)
          .slice(0, 8);

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
  }, []);

  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft(prevTime => {
        const newSeconds = prevTime.seconds - 1;
        const newMinutes = newSeconds < 0 ? prevTime.minutes - 1 : prevTime.minutes;
        const newHours = newMinutes < 0 ? prevTime.hours - 1 : prevTime.hours;

        return {
          hours: newHours < 0 ? 23 : newHours,
          minutes: newMinutes < 0 ? 59 : newMinutes,
          seconds: newSeconds < 0 ? 59 : newSeconds
        };
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } });
  };

  return (
    <div className="td-section">
      <div className="td-header">
        <div className="td-title-container">
          <h2 className="td-section-title">Today's Best Deals</h2>
          <div className="td-countdown">
            <span>Ends in:</span>
            <div className="td-timer">
              <div className="td-time-block">
                <span className="td-time">{timeLeft.hours.toString().padStart(2, '0')}</span>
                <span className="td-label">Hours</span>
              </div>
              <span className="td-separator">:</span>
              <div className="td-time-block">
                <span className="td-time">{timeLeft.minutes.toString().padStart(2, '0')}</span>
                <span className="td-label">Minutes</span>
              </div>
              <span className="td-separator">:</span>
              <div className="td-time-block">
                <span className="td-time">{timeLeft.seconds.toString().padStart(2, '0')}</span>
                <span className="td-label">Seconds</span>
              </div>
            </div>
          </div>
        </div>
        <Link to="/all-products" className="td-view-all-link">View All Deals</Link>
      </div>

      {products.length === 0 ? (
        <p className="td-no-deals">No deals available today.</p>
      ) : (
        <div className="td-product-grid">
          {products.map((product) => (
            <div
              key={product._id}
              className="td-product-card"
              onClick={() => handleClick(product)}
            >
              <div className="td-image-wrapper">
                <img
                  src={`${BASE_URL}${product.imageUrl}`}
                  alt={product.name}
                  className="td-product-image"
                />
                <div className="td-discount-badge">{product.discount}% OFF</div>
                <div className="td-stock-indicator">
                  {Math.random() > 0.5 ? 'Only few left!' : 'In Stock'}
                </div>
              </div>
              <div className="td-product-info">
                <h3 className="td-product-name">{product.name}</h3>
                <div className="td-price-section">
                  <span className="td-original-price">₹{product.mrp}</span>
                  <span className="td-deal-price">
                    ₹{(product.mrp * (1 - product.discount / 100)).toFixed(0)}
                  </span>
                </div>
                <div className="td-savings">
                  Save ₹{(product.mrp * (product.discount / 100)).toFixed(0)}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default TodaysDeal;
