import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import '../styles/NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  return (
    <div className="not-found-container">
      <div className="not-found-content">
        <div className="error-illustration">
          <div className="error-circle">
            <span className="error-number">404</span>
          </div>
          <div className="error-dots">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
        <h2>Page Not Found</h2>
        <p>Oops! The page you're looking for doesn't exist or has been moved.</p>
        <div className="action-buttons">
          <Link to="/" className="home-button">
            Return to Home
          </Link>
          <button onClick={() => navigate(-1)} className="back-button">
            Go Back
          </button>
        </div>
        <div className="suggestions">
          <p>You might want to check out:</p>
          <div className="suggestion-links">
            <Link to="/bestsellers">Bestsellers</Link>
            <Link to="/newarrivals">New Arrivals</Link>
            <Link to="/categories">Categories</Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default NotFound; 