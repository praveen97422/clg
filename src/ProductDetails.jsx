import React from "react";
import { useLocation } from "react-router-dom";
import "./styles/ProductDetails.css"; // Import the CSS file for styling

const ProductDetails = () => {
  const location = useLocation();
  const { product } = location.state || {};

  if (!product) {
    return <p>No product details available.</p>;
  }

  return (
    <div className="product-details-container">
      <h2>{product.name}</h2>
      <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} />
      <p>Price: ₹{product.price}</p>
      <p>Discount: {product.discount}%</p>
      <p>Description: {product.description}</p>
      {/* Add more product details as needed */}
    </div>
  );
};

export default ProductDetails;
