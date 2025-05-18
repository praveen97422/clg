import React from "react";
import { useCart } from "./CartContext.jsx";
import { Link } from "react-router-dom";
import "./styles/CartPage.css";
import { BASE_URL } from "./apiConfig.js";


import { useNavigate } from "react-router-dom";

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, loading } = useCart();
  const navigate = useNavigate();

  const handleRemove = (productId, ringSize = null) => {
    removeFromCart(productId, ringSize);
  };

  const handleQuantityChange = (productId, newQuantity, ringSize = null) => {
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity, ringSize);
    }
  };

  const calculateTotal = () => {
      return cart.reduce(
        (total, item) => {
          const price = parseFloat(item.product?.price) || 0;
          const quantity = parseInt(item.quantity) || 0;
          return total + (price * quantity);
        },
      0
    ).toFixed(2);
  };

  return (
    <div className="cart-container">
      <h2>Your Shopping Cart</h2>
      {cart.length === 0 ? (
        <p>Your cart is empty</p>
      ) : (
        <>
          <div className="cart-items">
            {cart.map((item) => (
              <div key={item._id} className="cart-item">
                {item.product?.imageUrl ? (
                  <Link to={`/product/${item.product._id}`} state={{ product: item.product }}>
                    <img 
                      src={`${BASE_URL}${item.product.imageUrl.startsWith('/') ? '' : '/'}${item.product.imageUrl}`} 
                      alt={item.product?.name || 'Product'} 
                      className="cart-item-image"
                      onError={(e) => {
                        e.target.onerror = null; 
                        e.target.src = '/placeholder-image.jpg'
                      }}
                    />
                  </Link>
                ) : (
                  <Link to={`/product/${item.product._id}`} state={{ product: item.product }} className="image-placeholder">
                    No Image
                  </Link>
                )}
                <div className="cart-item-details">
                  <Link to={`/product/${item.product._id}`} state={{ product: item.product }}style={{ textDecoration: "none" }}>
                    <h3>{item.product?.name || 'Unknown Product'}</h3>
                  </Link>
                  {item.ringSize && <p>Ring Size: {item.ringSize}</p>}
                  <p>Price: ₹{item.product?.price || '0.00'}</p>
                  <div className="quantity-control">
                    <button 
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1, item.ringSize)}
                      disabled={item.quantity <= 1}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => {
                        const maxStock = item.product.category === "Rings" && item.ringSize
                          ? (item.product.ringSize?.get ? item.product.ringSize.get(item.ringSize) : item.product.ringSize[item.ringSize])
                          : item.product.stock;
                        if (item.quantity < maxStock) {
                          handleQuantityChange(item._id, item.quantity + 1, item.ringSize);
                        }
                      }}
                      disabled={item.product.category === "Rings" && item.ringSize && item.quantity >= (item.product.ringSize?.get ? item.product.ringSize.get(item.ringSize) : item.product.ringSize[item.ringSize])}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => handleRemove(item._id, item.ringSize)}
                    className="remove-button"
                  >
                    Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
          <div className="cart-summary">
            <h3>Total: ₹{calculateTotal()}</h3>
            
            <button 
              className="checkout-button"
              onClick={() => navigate("/checkout")}
              disabled={loading}
            >
              {loading ? 'Processing...' : 'Proceed to Checkout'}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
