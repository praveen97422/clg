import React, { useEffect, useState } from "react"; 
import { useLocation } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import { useWishlist } from "./WishlistContext.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import LoginModal from "./auth/LoginModal.jsx";
import axios from "axios";
import "./styles/ProductDetails.css"; 

const ProductDetails = () => {
  const location = useLocation();
  const { product } = location.state || {};
  const { addToCart, removeFromCart, cart } = useCart();
  const { 
    addToWishlist, 
    removeFromWishlist, 
    wishlist, 
    loading: wishlistLoading,
    error: wishlistError
  } = useWishlist();
  
  const [isInWishlist, setIsInWishlist] = useState(false);
  const [localError, setLocalError] = useState(null);
  const [isInCart, setIsInCart] = useState(false);
  const [cartQuantity, setCartQuantity] = useState(0);
  const [showLoginModal, setShowLoginModal] = useState(false);
  const { isAuthenticated, user } = useAuth();
  const [reviews, setReviews] = useState([]);
  const [newReview, setNewReview] = useState({
    rating: 0,
    reviewText: ""
  });
  const [reviewError, setReviewError] = useState("");

  useEffect(() => {
    if (product) {
      if (wishlist) {
        setIsInWishlist(wishlist.some(item => item.product._id === product._id));
      }
      if (cart) {
        const cartItem = cart.find(item => item.product._id === product._id);
        setIsInCart(!!cartItem);
        setCartQuantity(cartItem?.quantity || 0);
      }
      const fetchReviews = async () => {
        try {
          const response = await axios.get(`http://localhost:5000/products/${product._id}/reviews`);
          setReviews(response.data.reviews);
        } catch (error) {
          console.error("Failed to fetch reviews:", error);
        }
      };
      fetchReviews();
    }
  }, [product, wishlist, cart]);

  const deleteReview = async (reviewId) => {
    try {
      const token = user.token; // Get the user's token for authentication
      await axios.delete(`http://localhost:5000/products/${product._id}/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Update the local state to remove the deleted review
      setReviews(reviews.filter(review => review._id !== reviewId));
    } catch (error) {
      console.error("Failed to delete review:", error);
      alert("Failed to delete review. Please try again.");
    }
  };

  if (!product) {
    return <p>No product details available.</p>;
  }

  const handleCartAction = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    try {
      if (!isInCart) {
        await addToCart(product._id, 1);
        setIsInCart(true);
      }
    } catch (error) {
      console.error("Cart operation failed:", error);
      setLocalError(error.message || "Failed to update cart");
    }
  };

  const handleWishlistAction = async () => {
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }
    
    setLocalError(null);
    try {
      if (isInWishlist) {
        const wishlistItem = wishlist.find(item => item.product._id === product._id);
        if (wishlistItem) {
          await removeFromWishlist(wishlistItem._id);
        }
      } else {
        await addToWishlist(product._id);
      }
    } catch (error) {
      console.error("Wishlist operation failed:", error);
      setLocalError(error.message || "Failed to update wishlist");
    }
  };

  const handleReviewSubmit = async (e) => {
    e.preventDefault();
    setReviewError("");
    
    if (!isAuthenticated) {
      setShowLoginModal(true);
      return;
    }

    if (!newReview.rating || !newReview.reviewText) {
      setReviewError("Please provide both rating and review text");
      return;
    }

    try {
      const token = user.token;

      const optimisticReview = {
        _id: Date.now().toString(), // temporary ID
        userName: "You", // Placeholder for the current user
        rating: newReview.rating,
        reviewText: newReview.reviewText,
        createdAt: new Date().toISOString()
      };
      setReviews(prev => [optimisticReview, ...prev]);

      const response = await axios.post(
        `http://localhost:5000/products/${product._id}/reviews`,
        {
          rating: newReview.rating,
          reviewText: newReview.reviewText
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (response.data && response.data.success) {
        setNewReview({ rating: 0, reviewText: "" });
      } else {
        throw new Error(response.data?.message || "Invalid response from server");
      }
    } catch (error) {
      console.error("Review submission failed:", error);
      setReviewError(
        error.response?.data?.message || 
        error.message || 
        "Failed to submit review. Please try again."
      );
    }
  };

  return (
    <div className="product-details-container">
      <div className="product-image-container">
        <img className="product-image" src={`http://localhost:5000${product.imageUrl}`} alt={product.name} />
      </div>
      <div className="product-info-container">
        <h2 className="product-title">{product.name}</h2>
        <p className="product-price">Price: ₹{product.price}</p>
        <p className="product-discount">Discount: {product.discount}%</p>
        <p className="product-description">Description: {product.description}</p>
        
        <div className="product-actions">
          <button
            className={isInCart ? "remove-from-cart-button" : "add-to-cart-button"}
            onClick={handleCartAction}
            disabled={isInCart}
          >
            {isInCart ? 'Already in Cart' : 'Add to Cart'}
          </button>
          
          <button
            className={`wishlist-button ${isInWishlist ? 'in-wishlist' : ''}`}
            onClick={handleWishlistAction}
            disabled={wishlistLoading}
          >
            {wishlistLoading ? 'Processing...' : 
             isInWishlist ? 'Remove from Wishlist' : 'Add to Wishlist'}
          </button>
        </div>

        {localError && <p className="error-message">{localError}</p>}
        {wishlistError && <p className="error-message">{wishlistError}</p>}
        {reviewError && <p className="error-message">{reviewError}</p>}
        
        <div className="reviews-section">
          <h3>Customer Reviews</h3>
          {reviews.length > 0 ? (
            <div className="reviews-list">
              {reviews.map((review) => (
                <div key={review._id} className="review-item">
                  <div className="review-header">
                    <span className="review-user">{review.userName}</span>
                    <span className="review-rating">
                      {'★'.repeat(review.rating)}{'☆'.repeat(5 - review.rating)}
                    </span>
                  </div>
                  <p className="review-text">{review.reviewText}</p>
                  <div className="review-date">
                    {new Date(review.createdAt).toLocaleDateString()}
                  </div>
                  {isAuthenticated && (user._id === review.userId || user.isAdmin) && (
                    <button onClick={() => deleteReview(review._id)}>Delete</button>
                  )}
                </div>
              ))}
            </div>
          ) : ( 
            <p>No reviews yet. Be the first to review!</p>
          )}

          {isAuthenticated ? (
            <form onSubmit={handleReviewSubmit} className="review-form">
              <h4>Add Your Review</h4>
              <div className="rating-input">
                <label>Rating:</label>
                <select
                  value={newReview.rating}
                  onChange={(e) => setNewReview({
                    ...newReview,
                    rating: parseInt(e.target.value)
                  })}
                  required
                >
                  <option value="0">Select rating</option>
                  <option value="1">1 Star</option>
                  <option value="2">2 Stars</option>
                  <option value="3">3 Stars</option>
                  <option value="4">4 Stars</option>
                  <option value="5">5 Stars</option>
                </select>
              </div>
              <div className="review-text-input">
                <label>Review:</label>
                <textarea
                  value={newReview.reviewText}
                  onChange={(e) => setNewReview({
                    ...newReview,
                    reviewText: e.target.value
                  })}
                  required
                />
              </div>
              <button type="submit" className="submit-review-button">
                Submit Review
              </button>
            </form>
          ) : null}
        </div>
      </div>
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
};

export default ProductDetails;
