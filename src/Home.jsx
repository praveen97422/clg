import React, { useState, useEffect } from "react";
import axios from "axios";
import "./styles/Home.css"; // Importing the CSS file

export default function Home() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await axios.get("http://localhost:5000/products");
      setProducts(res.data.products);
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="home-container">
      <h2>All Products</h2>
      {loading ? <p>Loading products...</p> : (
        <div className="product-grid">
          {products.length === 0 ? <p>No products available.</p> : (
            products.map((product) => (
              <div key={product._id} className="product-card">
                <img src={`http://localhost:5000${product.imageUrl}`} alt={product.name} className="product-image" onError={(e) => { e.target.onerror = null; e.target.src = '/path/to/default/image.jpg'; }} />

                <p className="product-name">{product.name}</p>
                <p className="product-price">₹{product.price}</p>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}
