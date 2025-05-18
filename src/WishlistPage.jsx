import React, { useEffect } from "react";
import { useWishlist } from "./WishlistContext";
import { Link } from "react-router-dom";
import "./styles/WishlistPage.css";
import { BASE_URL } from "./apiConfig.js";
import { BiBorderBottom } from "react-icons/bi";

const WishlistPage = () => {
  const { wishlist, loading, error, removeFromWishlist, clearWishlist } = useWishlist();

  useEffect(() => {
    // Fetch wishlist when component mounts
  }, []);

  if (loading) return <div>Loading...</div>;
  // if (error) return <div>{error}</div>;

  return (
    <div className="wishlist-container">
      <h1>Your Wishlist</h1>
      {wishlist.length === 0 ? (
        <p>Your wishlist is empty.</p>
      ) : (
        <div>
          <ul style={{ listStyleType: "none", padding: 0 }}>
            {wishlist.map((item) => (
              <li key={item._id} className="wishlist-item">
                <div className="wishlist-item-content">
                  <Link 
                    to={`/product/${item.product._id}`} 
                    state={{ product: item.product }}
                    className="wishlist-item-link"
                  >
                    <img 
                      src={`${BASE_URL}${item.product.imageUrl}`}
                      alt={item.product.name}
                      onError={(e) => {
                        e.target.src = 'https://via.placeholder.com/150';
                      }}
                    />
                    <div className="item-details">
                      <h2>{item.product.name}</h2>
                      <p>Price: ${item.product.price}</p>
                    </div>
                  </Link>
                  <button 
                    onClick={(e) => {
                      e.stopPropagation();
                      removeFromWishlist(item._id);
                    }}
                    className="remove-btn"
                    title="Remove from wishlist"
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M3 6H5H21" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                      <path d="M8 6V4C8 3.46957 8.21071 2.96086 8.58579 2.58579C8.96086 2.21071 9.46957 2 10 2H14C14.5304 2 15.0391 2.21071 15.4142 2.58579C15.7893 2.96086 16 3.46957 16 4V6M19 6V20C19 20.5304 18.7893 21.0391 18.4142 21.4142C18.0391 21.7893 17.5304 22 17 22H7C6.46957 22 5.96086 21.7893 5.58579 21.4142C5.21071 21.0391 5 20.5304 5 20V6H19Z" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </button>
                </div>
              </li>
            ))}
          </ul>
          <button className="clear-wishlist" onClick={clearWishlist}>Clear Wishlist</button>
        </div>
      )}
    </div>
  );
};

export default WishlistPage;
