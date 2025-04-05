import React from "react";
import { useLocation } from "react-router-dom";
import { useCart } from "./CartContext.jsx"; // Import the cart context
import "./styles/ProductDetails.css"; 

const ProductDetails = () => {
  const location = useLocation();
  const { product } = location.state || {};
  const { dispatch } = useCart(); // Get cart functions

  if (!product) {
    return <p>No product details available.</p>;
  }

  const handleAddToCart = () => {
    dispatch({ type: "ADD_TO_CART", payload: product });
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
        <button className="add-to-cart-button" onClick={handleAddToCart}>
          Add to Cart
        </button>
      </div>
    </div>
  );
};

export default ProductDetails;
