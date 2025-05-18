import React, { useEffect, useState, useRef } from "react"; 
import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useCart } from "./CartContext.jsx";
import { useWishlist } from "./WishlistContext.jsx";
import { useAuth } from "./auth/AuthContext.jsx";
import LoginModal from "./auth/LoginModal.jsx";
import axios from "axios";
import { BASE_URL } from "./apiConfig.js";
import { FaShoppingCart } from "react-icons/fa";
import "./styles/ProductDetails.css"; 

const ProductDetails = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { id } = useParams();
  const [product, setProduct] = useState(location.state?.product || null);
  const { addToCart, removeFromCart, cart } = useCart();
  const { 
    addToWishlist, 
    removeFromWishlist, 
    wishlist, 
    loading: wishlistLoading,
    // error: wishlistError
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
  const [selectedRingSize, setSelectedRingSize] = useState(null);

  const [suggestedProducts, setSuggestedProducts] = useState([]);
  const reviewFormRef = useRef(null);
  const suggestedProductsRef = useRef(null);
  const [animateScroll, setAnimateScroll] = useState('');
  const [scrollDirection, setScrollDirection] = useState('');
  const [isAtStart, setIsAtStart] = useState(true);
  const [isAtEnd, setIsAtEnd] = useState(false);

  // Removed automatic scroll to review form on product load as per user request
  // Also removed any focus or navigation that might cause page to jump to suggestions or reviews
  // No scrolling or focus logic present now to avoid jumping to suggestions or reviews

  // Fetch product on id change or if product is null
  useEffect(() => {
    window.scrollTo(0, 0); // Scroll to top on product id change
    const fetchProduct = async () => {
      try {
        const response = await axios.get(`${BASE_URL}/products`);
        const foundProduct = response.data.products.find(p => p._id === id);
        if (foundProduct) {
          setProduct(foundProduct);
          setLocalError(null);
        } else {
          setProduct(null);
          setLocalError("Product not found");
        }
      } catch (error) {
        console.error("Failed to fetch product:", error);
        setLocalError("Failed to fetch product");
      }
    };
    if (!product || product._id !== id) {
      fetchProduct();
    }
  }, [id]);

  useEffect(() => {
    if (product) {
      if (wishlist) {
        setIsInWishlist(wishlist.some(item => item.product._id === product._id));
      }
      if (cart) {
        if (product.category === "Rings" && selectedRingSize) {
          const cartItem = cart.find(item => item.product._id === product._id && item.ringSize === selectedRingSize);
          setIsInCart(!!cartItem);
          setCartQuantity(cartItem?.quantity || 0);
        } else {
          const cartItem = cart.find(item => item.product._id === product._id);
          setIsInCart(!!cartItem);
          setCartQuantity(cartItem?.quantity || 0);
        }
      }

      // Set default ring size if it's a ring product
      if (product.category === "Rings" && product.ringSize && !selectedRingSize) {
        // Find the first size that has stock
        const firstAvailableSize = Object.entries(product.ringSize).find(([_, stock]) => stock > 0)?.[0];
        if (firstAvailableSize) {
          setSelectedRingSize(firstAvailableSize);
        }
      }

      const fetchReviews = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/products/${product._id}/reviews`);
          setReviews(response.data.reviews);
        } catch (error) {
          console.error("Failed to fetch reviews:", error);
        }
      };
      fetchReviews();

      const fetchAllProducts = async () => {
        try {
          const response = await axios.get(`${BASE_URL}/products`);
          if (response.data && response.data.products) {
            // Filter suggested products based on category or option, excluding current product
            const suggested = response.data.products.filter(p => 
              p._id !== product._id && 
              (p.category === product.category || p.option === product.option ))
              
            setSuggestedProducts(suggested);
          }
        } catch (error) {
          console.error("Failed to fetch all products for suggestions:", error);
        }
      };
      fetchAllProducts();
    }
  }, [product, wishlist, cart, selectedRingSize]);

  const deleteReview = async (reviewId) => {
    try {
      const token = user.token; // Get the user's token for authentication
      await axios.delete(`${BASE_URL}/products/${product._id}/reviews/${reviewId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      // Refetch reviews after deletion
      const response = await axios.get(`${BASE_URL}/products/${product._id}/reviews`);
      setReviews(response.data.reviews);
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
        if (product.category === "Rings") {
          if (!selectedRingSize) {
            setLocalError("Please select a ring size.");
            return;
          }
          await addToCart(product._id, 1, selectedRingSize);
        } else {
          await addToCart(product._id, 1);
        }
        setIsInCart(true);
      } else {
        // Redirect to cart page if already in cart
        navigate("/cart");
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
        `${BASE_URL}/products/${product._id}/reviews`,
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

  const averageRating = reviews.length > 0 ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length) : 0;
  const roundedRating = Math.round(averageRating);

  return (
    <div>
      <div className="product-details-container">
        <div className="product-image-containers">
          <div style={{ position: "relative" }}>
            <img className="product-images" src={`${BASE_URL}${product.imageUrl}`} alt={product.name} />
            {/* Discount badge removed for main product image as per user request */}
          </div>
        </div>
        <div className="product-info-container">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
            <h3 className="product-title" style={{ margin: 0 }}>{product.name}</h3>
            <div className="average-rating" aria-label={`Average rating: ${averageRating.toFixed(1)} out of 5`}>
              {[...Array(5)].map((_, i) => (
                <span
                  key={i}
                  className={i < roundedRating ? "star-filled" : "star-empty"}
                  style={{ fontSize: "24px" }}
                >
                  &#9733;
                </span>
              ))}
              <span style={{ marginLeft: "6px", fontSize: "16px", color: "#555" }}>
                {averageRating.toFixed(1)}
              </span>
            </div>
          </div>
          <p className="product-price">Price: ₹{product.price}</p>
          <p className="product-discount">Discount: {product.discount}%</p>
           
          <p className="product-description">Description:</p>
          <p className="product-categories">Category: {product.category}</p>
          <p className="product-description-text">{product.description}</p>
         

          {product.category === "Rings" && product.ringSize && (
            <div className="ring-size-buttons">
              <p>Select Ring Size:</p>
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                {Object.entries(product.ringSize).map(([size, stock]) => (
                  <button
                    key={size}
                    disabled={stock <= 0}
                    onClick={() => setSelectedRingSize(size)}
                    style={{
                      padding: "8px 12px",
                      borderRadius: "4px",
                      border: selectedRingSize === size ? "2px solid #007bff" : "1px solid #ccc",
                      backgroundColor: selectedRingSize === size ? "#007bff" : "#fff",
                      color: selectedRingSize === size ? "#fff" : "#000",
                      cursor: stock <= 0 ? "not-allowed" : "pointer",
                      opacity: stock <= 0 ? 0.5 : 1,
                    }}
                  >
                   Size : {size} {/* {size} ({stock} in stock) */}
                  </button>
                ))}
              </div>
            </div>
          )}
          
          <div className="product-action-s">
            <div className="top-buttons">
              <button
                className={isInCart ? "remove-from-cart-button" : "add-to-cart-button"}
                onClick={handleCartAction}
                disabled={product.category === "Rings" ? 
                  (selectedRingSize ? product.ringSize[selectedRingSize] <= 0 : true) : 
                  product.stock <= 0}
              >
                {product.category === "Rings" ? 
                  (selectedRingSize && product.ringSize[selectedRingSize] <= 0) || 
                  (!selectedRingSize && Object.values(product.ringSize).every(stock => stock <= 0)) ? 
                  <span>Out of Stock</span> : 
                  isInCart ? <><FaShoppingCart style={{ marginRight: "6px" }} /> Go to Cart</> : 
                  <><FaShoppingCart style={{ marginRight: "6px" }} /> Add to Cart</> :
                  product.stock <= 0 ? <span>Out of Stock</span> :
                  isInCart ? <><FaShoppingCart style={{ marginRight: "6px" }} /> Go to Cart</> : 
                  <><FaShoppingCart style={{ marginRight: "6px" }} /> Add to Cart</>
                }
              </button>

              <button
                className={`wishlist-button ${isInWishlist ? 'in-wishlist' : ''}`}
                onClick={handleWishlistAction}
                disabled={wishlistLoading}
                aria-label={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
                title={isInWishlist ? "Remove from Wishlist" : "Add to Wishlist"}
              >
              {wishlistLoading ? (
                '.'
              ) : (
                <>
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    fill={isInWishlist ? "#e74c3c" : "none"}
                    stroke="#e74c3c"
                    strokeWidth="2"
                    viewBox="0 0 24 24"
                    width="20"
                    height="20"
                    style={{ verticalAlign: "middle" }}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M12 21C12 21 7 16.5 5 12.5C3 8.5 6 5 12 9C18 5 21 8.5 19 12.5C17 16.5 12 21 12 21Z"
                    />
                  </svg>
                </>
              )}
              </button>
            </div>

            <button
              className="buy-now-button wobble-hor-bottom"
              onClick={() => {
                if (!isAuthenticated) {
                  setShowLoginModal(true);
                  return;
                }
                if (product.category === "Rings" && !selectedRingSize) {
                  setLocalError("Please select a ring size.");
                  return;
                }
                // Prepare single product item for checkout
                const checkoutItem = {
                  product,
                  quantity: 1,
                  ringSize: product.category === "Rings" ? selectedRingSize : null
                };
                // Navigate to checkout with single product in state without adding to cart
                navigate("/checkout", { state: { singleCheckoutItem: checkoutItem } });
              }}
              disabled={product.category === "Rings" ? 
                (selectedRingSize ? product.ringSize[selectedRingSize] <= 0 : true) : 
                product.stock <= 0}
            >
              {product.category === "Rings" ? 
                (selectedRingSize && product.ringSize[selectedRingSize] <= 0) || 
                (!selectedRingSize && Object.values(product.ringSize).every(stock => stock <= 0)) ? 
                <span>Out of Stock</span> : "Buy Now" :
                product.stock <= 0 ? <span>Out of Stock</span> : "Buy Now"
              }
            </button>
          </div>

          {localError && <p className="error-message">{localError}</p>}
          {/* {wishlistError && <p className="error-message">{wishlistError}</p>} */}
          {reviewError && <p className="error-message">{reviewError}</p>}
        </div>
      </div>

      {/* Suggested Products Section */}
      {suggestedProducts.length > 0 && (
        <div className="suggested-products-section">
          <h2>Similar Products</h2>
          <div className="suggested-products-container" style={{ position: "relative" }}>
            {!isAtStart && (
              <button 
                className="scroll-button left" 
                onClick={() => {
                  if (suggestedProductsRef.current) {
                    suggestedProductsRef.current.scrollBy({ left: -500, behavior: 'smooth' });
                  }
                  setAnimateScroll('left');
                  setScrollDirection('left');
                  setTimeout(() => {
                    setAnimateScroll('');
                    setScrollDirection('');
                  }, 300);
                }}
                aria-label="Scroll left"
              >
                &#9664;
              </button>
            )}
            <div 
              className="suggested-products-list" 
              ref={suggestedProductsRef}
              onScroll={() => {
                if (suggestedProductsRef.current) {
                  const { scrollLeft, scrollWidth, clientWidth } = suggestedProductsRef.current;
                  setIsAtStart(scrollLeft === 0);
                  setIsAtEnd(scrollLeft + clientWidth >= scrollWidth - 1);
                }
              }}
            >
              {suggestedProducts.map((sp) => (
                <div 
                  key={sp._id} 
                  className="suggested-product-card"
                  onClick={() => navigate(`/product/${sp._id}`)}
                >
                  <div style={{ position: "relative" }}>
                    <img 
                      src={`${BASE_URL}${sp.imageUrl}`} 
                      alt={sp.name} 
                      className={`suggested-product-image ${animateScroll && scrollDirection === 'left' ? 'scroll-animate-left' : ''} ${animateScroll && scrollDirection === 'right' ? 'scroll-animate-right' : ''}`} 
                    />
                    {sp.discount > 0 && (
                      <div className="suggested-product-discount-badge">
                        {sp.discount}% OFF
                      </div>
                    )}
                  </div>
                  <p className="suggested-product-name">{sp.name}</p>
                  <p className="suggested-product-price">₹{sp.price}</p>
                </div>
              ))}
            </div>
            {!isAtEnd && (
              <button 
                className="scroll-button right" 
                onClick={() => {
                  if (suggestedProductsRef.current) {
                    suggestedProductsRef.current.scrollBy({ left: 800, behavior: 'smooth' });
                  }
                  setAnimateScroll('right');
                  setScrollDirection('right');
                  setTimeout(() => {
                    setAnimateScroll('');
                    setScrollDirection('');
                  }, 800);
                }}
                aria-label="Scroll right"
              >
                &#9654;
              </button>
            )}
          </div>
        </div>
      )}

      {/* Reviews Section */}
      <div className="reviews-section" ref={reviewFormRef}>
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
                {isAuthenticated && (user.uid === review.userId || user.isAdmin) && (
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
      {showLoginModal && (
        <LoginModal onClose={() => setShowLoginModal(false)} />
      )}
    </div>
  );
};

export default ProductDetails;
