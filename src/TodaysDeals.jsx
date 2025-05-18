import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import "./styles/TodaysDeals.css";
import axios from "axios";
import { BASE_URL } from "./apiConfig";

const CACHE_KEY = "cachedTodaysDeals";
const CACHE_TIMESTAMP_KEY = "cachedTodaysDealsTimestamp";
const CACHE_DURATION = 7 * 24 * 60 * 60 * 1000; // 7 days in milliseconds

// Helper function to extract essential fields for comparison
const getDealSignature = (product) => ({
  id: product._id,
  discount: product.discount,
  stock: product.stock,
  mrp: product.mrp
});

const TodaysDeals = () => {
  const navigate = useNavigate();
  const [timeLeft, setTimeLeft] = useState({
    hours: 23,
    minutes: 59,
    seconds: 59
  });
  const [products, setProducts] = useState([]);
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
        const newProducts = res.data.products
          .sort((a, b) => b.discount - a.discount)
          .slice(0, 6);

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

  const handleProductClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } });
  };

  return (
    <section className="deals-section">
      <div className="deals-header">
        <div className="deals-title-container">
          <h2 className="deals-title">Today's Flash Deals</h2>
          <div className="deals-subtitle">Limited time offers on premium jewelry</div>
        </div>
        <div className="countdown-timer">
          <div className="timer-label">Ends in:</div>
          <div className="timer-display">
            <div className="timer-unit">
              <span className="timer-value">{timeLeft.hours.toString().padStart(2, '0')}</span>
              <span className="timer-label">Hours</span>
            </div>
            <div className="timer-separator">:</div>
            <div className="timer-unit">
              <span className="timer-value">{timeLeft.minutes.toString().padStart(2, '0')}</span>
              <span className="timer-label">Minutes</span>
            </div>
            <div className="timer-separator">:</div>
            <div className="timer-unit">
              <span className="timer-value">{timeLeft.seconds.toString().padStart(2, '0')}</span>
              <span className="timer-label">Seconds</span>
            </div>
          </div>
        </div>
      </div>

      <div className="deals-grid">
        {products.map((product) => (
          <div
            key={product._id}
            className="deal-card"
            onClick={() => handleProductClick(product)}
          >
            <div className="deal-image-container">
              <img src={`${BASE_URL}${product.imageUrl}`} alt={product.name} className="deal-image" />
              <div className="deal-badges">
                <span className="discount-badge">-{product.discount}%</span>
                <span className="flash-badge">Flash Sale</span>
              </div>
              <div className="stock-indicator">
                <div className="stock-bar">
                  <div 
                    className="stock-progress" 
                    style={{ width: `${(product.stock / (product.stock + 10)) * 100}%` }}
                  ></div>
                </div>
                <span className="stock-text">{product.stock} left</span>
              </div>
            </div>
            <div className="deal-info">
              <h3 className="deal-name">{product.name}</h3>
              <div className="deal-pricing">
                <span className="original-price">₹{product.mrp}</span>
                <span className="discounted-price">₹{(product.mrp * (1 - product.discount / 100)).toFixed(0)}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
};

export default TodaysDeals; 