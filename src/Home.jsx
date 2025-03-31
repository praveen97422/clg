import React, { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import "./styles/Home.css";

const Home = () => {
  const [products, setProducts] = useState([]);
  const navigate = useNavigate(); // Initialize useNavigate

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/products");
        setProducts(res.data.products);
      } catch (error) {
        console.error("Error fetching products:", error);
      }
    };

    fetchProducts();
  }, []);

  const categorizedProducts = products.reduce((acc, product) => {
    const category = product.category || "Others"; // Default to "Others" if no category
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(product);
    return acc;
  }, {});

  const handleDoubleClick = (product) => {
    navigate(`/product/${product._id}`, { state: { product } }); // Navigate to product details page
  };

  return (
    <div className="home-container">
      <h2>Product List</h2>
      {Object.keys(categorizedProducts).length === 0 ? (
        <p>No products available.</p>
      ) : (
        Object.keys(categorizedProducts).map((category) => (
          <div key={category} className="category-section">
            <h3 className="section-title">{category}</h3>
            <div className="product-grid">
              {categorizedProducts[category].map((product) => (
                <div key={product._id} className="product-card" onDoubleClick={() => handleDoubleClick(product)}>
                  <img className="product-image" src={`http://localhost:5000${product.imageUrl}`} alt={product.name} />
                  <div className="product-details">
                    <p className="product-name">{product.name}</p>
                    <p className="product-price">Price: ₹{product.price}</p>
                    <p className="product-discount">Discount: {product.discount}%</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default Home;
