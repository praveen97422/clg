import React from "react";
import { useCart } from "./CartContext.jsx";
import { Link } from "react-router-dom";
import "./styles/CartPage.css";

const CartPage = () => {
  const { cart, removeFromCart, updateQuantity, checkout, loading } = useCart();

  const handleRemove = (productId) => {
    removeFromCart(productId);
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity > 0) {
      updateQuantity(productId, newQuantity);
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
                      src={`http://localhost:5000${item.product.imageUrl.startsWith('/') ? '' : '/'}${item.product.imageUrl}`} 
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
                  <Link to={`/product/${item.product._id}`} state={{ product: item.product }}>
                    <h3>{item.product?.name || 'Unknown Product'}</h3>
                  </Link>
                  <p>Price: ₹{item.product?.price || '0.00'}</p>
                  <div className="quantity-control">
                    <button 
                      onClick={() => handleQuantityChange(item._id, item.quantity - 1)}
                    >
                      -
                    </button>
                    <span>{item.quantity}</span>
                    <button 
                      onClick={() => handleQuantityChange(item._id, item.quantity + 1)}
                    >
                      +
                    </button>
                  </div>
                  <button 
                    onClick={() => handleRemove(item._id)}
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
              onClick={async () => {
                try {
                  await checkout();
                  alert('Checkout successful! Your order has been placed.');
                } catch (error) {
                  console.error('Checkout failed:', error);
                }
              }}
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
