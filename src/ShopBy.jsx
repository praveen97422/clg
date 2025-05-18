import React, { useEffect, useState } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import "./styles/Home.css";
import { useNavigate } from "react-router-dom";
import { BASE_URL } from "./apiConfig.js";

const ShopBySection = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  const getRandomizedProducts = (productList, count = 24) => {
    const shuffled = [...productList];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled.slice(0, count);
  };

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get(`${BASE_URL}/products`);
        const randomized = getRandomizedProducts(res.data.products);
        setProducts(randomized);
      } catch (error) {
        console.error("Error fetching products:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []); // Only runs once when page loads

  if (loading) return <div className="shopby-container">Loading...</div>;

  return (
    <div className="shopby-container">
      <h2>Featured Products</h2>
      <div className="product-grid">
        {products.map((product) => {
          const imageSrc = product.imageUrl;
          const finalImage = imageSrc
            ? `${BASE_URL}${imageSrc}`
            : "/placeholder.jpg";

          return (
            <div key={product._id} className="product-card">
              
              <Link to={`/product/${product._id}`} state={{ product }} style={{ textDecoration: "none",color:"black" }}>
                <div>
                  <img
                    src={finalImage}
                    alt={product.name}
                    className="product-image"
                    onError={(e) => {
                      if (!e.target.src.includes("placeholder.jpg")) {
                        e.target.onerror = null;
                        e.target.src = "/placeholder.jpg";
                      }
                    }}
                  />

                </div>
                <div className="product-details">
                  <p className="product-name">{product.name}</p>
                  <p className="product-price">₹{product.price}</p>
                </div>
              </Link>
              
            </div>
          );
        })}
      </div>
    </div>
  );
};

export default ShopBySection;
