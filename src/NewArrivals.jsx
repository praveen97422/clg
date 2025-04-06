import React from "react";
import "./styles/Home.css";
import { useEffect, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";

const NewArrivals = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await axios.get("http://localhost:5000/products");
        const sortedProducts = res.data.products.sort((a, b) => 
          new Date(b.timestamp || b.createdAt) - new Date(a.timestamp || a.createdAt)
        );
        setProducts(sortedProducts);
      } catch (error) {
        console.error("Error fetching products:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const groupProductsByTime = () => {
    const now = new Date();
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

    return {
      thisWeek: products.filter(p => new Date(p.timestamp || p.createdAt) > oneWeekAgo),
      thisMonth: products.filter(p => new Date(p.timestamp || p.createdAt) > oneMonthAgo && 
                                     new Date(p.timestamp || p.createdAt) <= oneWeekAgo),
      older: products.filter(p => new Date(p.timestamp || p.createdAt) <= oneMonthAgo)
    };
  };

  const { thisWeek, thisMonth, older } = groupProductsByTime();

  if (loading) return <div className="home-container">Loading...</div>;

  return (
    <div className="home-container">
      {thisWeek.length > 0 && (
        <section>
          <h2>New This Week</h2>
          <div className="product-grid">
            {thisWeek.map((product) => (
              <ProductCard key={product._id} product={product} navigate={navigate} />
            ))}
          </div>
        </section>
      )}

      {thisMonth.length > 0 && (
        <section>
          <h2>New This Month</h2>
          <div className="product-grid">
            {thisMonth.map((product) => (
              <ProductCard key={product._id} product={product} navigate={navigate} />
            ))}
          </div>
        </section>
      )}

      {older.length > 0 && (
        <section>
          <h2>Older Arrivals</h2>
          <div className="product-grid">
            {older.map((product) => (
              <ProductCard key={product._id} product={product} navigate={navigate} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
};

const ProductCard = ({ product, navigate }) => {
  const handleClick = () => {
    console.log('Navigating to product:', product._id);
    console.log('Product data:', product);
    try {
      navigate(`/product/${product._id}`, { state: { product } });
    } catch (error) {
      console.error('Navigation error:', error);
    }
  };

  return (
    <div 
      className="product-card" 
      onClick={handleClick}
    >
      <img 
        src={`http://localhost:5000${product.imageUrl}`} 
        alt={product.name} 
        className="product-image" 
      />
      <div className="product-details">
        <p className="product-name">{product.name}</p>
        <p className="product-price">₹{product.price}</p>
      </div>
    </div>
  );
};

export default NewArrivals;
