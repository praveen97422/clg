import React from "react";
import { useCart } from "./CartContext.jsx";
import { Link } from "react-router-dom";
import "./styles/ProductDetails.css";
import "./styles/Cartpage.css";

const CartPage = () => {
  const { cart, dispatch } = useCart();

  const handleRemove = (productId) => {
    dispatch({ type: "REMOVE_FROM_CART", payload: productId });
  };

  const handleQuantityChange = (productId, newQuantity) => {
    if (newQuantity > 0) {
      dispatch({ 
        type: "UPDATE_QUANTITY", 
        payload: { _id: productId, quantity: newQuantity } 
      });
    }
  };

  const calculateTotal = () => {
    return cart.reduce(
      (total, item) => total + item.price * item.quantity,
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
                <img 
                  src={`http://localhost:5000${item.imageUrl}`} 
                  alt={item.name} 
                  className="cart-item-image"
                />
                <div className="cart-item-details">
                  <h3>{item.name}</h3>
                  <p>Price: ₹{item.price}</p>
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
            <button className="checkout-button">Proceed to Checkout</button>
          </div>
        </>
      )}
    </div>
  );
};

export default CartPage;
