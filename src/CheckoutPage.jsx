import React, { useState, useEffect } from "react";
import { useCart } from "./CartContext.jsx";
import { useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "./auth/AuthContext.jsx";
import axios from "axios";
import { BASE_URL } from "./apiConfig.js";
import UserDetailsForm from "./auth/UserDetailsForm.jsx";
import "./styles/CheckoutPage.css";

const CheckoutPage = () => {
  const { cart, checkout, loading } = useCart();
  const { user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const state = (location && location.state) || {};
  const singleCheckoutItem = state.singleCheckoutItem || null;

  const [userDetails, setUserDetails] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [error, setError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);

  const fetchUserDetails = async () => {
    try {
      if (!user || !user.token) {
        setError("User authentication error");
        return;
      }
      const token = user.token;
      const response = await axios.get(`${BASE_URL}/user/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.user) {
        const userData = response.data.user;
        setUserDetails(userData);
      } else {
        setError("No user details found");
      }
    } catch (err) {
      setError("Error fetching user details");
    }
  };

  useEffect(() => {
    fetchUserDetails();
  }, [user]);

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancel = () => {
    setEditMode(false);
  };

  const handleUserDetailsSubmit = async (updatedData) => {
    try {
      if (!user || !user.token) {
        setError("User authentication error");
        return;
      }
      const token = user.token;
      const response = await axios.put(
        `${BASE_URL}/user/profile`,
        updatedData,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
      if (response.data && response.data.user) {
        setUserDetails(response.data.user);
        setError(null);
        setSuccessMessage("User details updated successfully.");
        setEditMode(false);
      } else {
        setError("Failed to update user details.");
      }
    } catch (err) {
      setError("Error updating user details.");
    }
  };

  const validateStock = () => {
    const itemsToCheck = singleCheckoutItem ? [singleCheckoutItem] : cart;
    for (const item of itemsToCheck) {
      const maxStock = item.product.category === "Rings" && item.ringSize
        ? (item.product.ringSize?.get ? item.product.ringSize.get(item.ringSize) : item.product.ringSize[item.ringSize])
        : item.product.stock;
      if (item.quantity > maxStock) {
        return `Insufficient stock for ${item.product.name} (Ring Size: ${item.ringSize || "N/A"})`;
      }
    }
    return null;
  };

  const handleCouponApply = async () => {
    try {
      if (!couponCode) {
        setError("Please enter a coupon code");
        return;
      }
      const token = user.token;
      const response = await axios.post(`${BASE_URL}/coupons/validate`, { code: couponCode }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.valid) {
        setDiscount(response.data.discountAmount || 0);
        setError(null);
      } else {
        setError("Invalid coupon code");
        setDiscount(0);
      }
    } catch (err) {
      setError("Error validating coupon");
      setDiscount(0);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccessMessage(null);

    if (!userDetails || !userDetails.name ||  !userDetails.address || !userDetails.phoneNumber) {
      setError("Please fill in all required fields.");
      return;
    }

    const stockError = validateStock();
    if (stockError) {
      setError(stockError);
      return;
    }

    try {
      const itemsToOrder = singleCheckoutItem ? [singleCheckoutItem] : cart;
      const orderData = {
        userDetails,
        paymentMethod,
        couponCode,
        items: itemsToOrder.map(item => ({
          productId: item.product._id,
          name: item.product.name,
          price: item.product.price,
          quantity: item.quantity,
          ringSize: item.ringSize || null,
        })),
      };
      const response = await checkout(orderData);
      setSuccessMessage("Checkout successful! Your order has been placed.");
      setError(null);
      setTimeout(() => {
        navigate("/");
      }, 3000);
    } catch (err) {
      console.error("Checkout error response:", err.response);
      setError(err.response?.data?.message || "Checkout failed. Please try again.");
      setSuccessMessage(null);
    }
  };

  const itemsToDisplay = singleCheckoutItem ? [singleCheckoutItem] : cart;

  if (itemsToDisplay.length === 0) {
    return (
      <div className="checkout-container">
        <h2>Your cart is empty</h2>
      </div>
    );
  }

  const totalPrice = itemsToDisplay.reduce((total, item) => {
    const price = parseFloat(item.product?.price) || 0;
    const quantity = parseInt(item.quantity) || 0;
    return total + price * quantity;
  }, 0);

  const finalPrice = totalPrice - discount;

  return (
    <div className="checkout-container">
      <h2>Checkout</h2>
      {userDetails && !editMode ? (
        <div className="user-details-view">
          {userDetails.picture && (
            <img src={userDetails.picture} alt="User Profile" className="profile-pic" />
          )}
          <p><strong>Name:</strong> {userDetails.name||"Not provided"}</p>
          <p><strong>Date of Birth:</strong> {userDetails.dob ? new Date(userDetails.dob).toLocaleDateString() : "Not provided"}</p>
          <p><strong>Address:</strong> {userDetails.address || "Not provided"}</p>
          <p><strong>Contact Number:</strong> {userDetails.phoneNumber || "Not provided"}</p>
          <p><strong>Secondary Number:</strong> {userDetails.additionalPhoneNumber || "Not provided"}</p>
          <button className="edit-button" onClick={handleEditClick}>Edit</button>
          <button onClick={handleSubmit} disabled={loading}>
            {loading ? "Processing..." : "Use These Details & Confirm Order"}
          </button>
          {error && <p className="error-message">{error}</p>}
          {successMessage && <p className="success-message">{successMessage}</p>}
        </div>
      ) : (
        <UserDetailsForm
          initialData={{
            name: userDetails ? userDetails.name || "" : "",
            dob: userDetails ? (userDetails.dob ? new Date(userDetails.dob).toISOString().split("T")[0] : "") : "",
            address: userDetails ? userDetails.address || "" : "",
            phoneNumber: userDetails ? userDetails.phoneNumber || "" : "",
            additionalPhoneNumber: userDetails ? userDetails.additionalPhoneNumber || "" : "",
          }}
          userProfile={userDetails}
          onSubmit={handleUserDetailsSubmit}
          onCancel={handleCancel}
          isEditing={editMode}
          popupMode={true}
          
        />
      )}
      {loading && <p>Processing your order...</p>}
      {error && <p className="error-message">{error}</p>}

      <div className="payment-section">
        <h3>Select Payment Method</h3>
        <label>
          <input type="radio" name="payment" value="cod" checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
          Cash on Delivery
        </label>
        <label>
          <input type="radio" name="payment" value="card" checked={paymentMethod === "card"} onChange={() => setPaymentMethod("card")} />
          Credit/Debit Card
        </label>
        <label>
          <input type="radio" name="payment" value="netbanking" checked={paymentMethod === "netbanking"} onChange={() => setPaymentMethod("netbanking")} />
          Net Banking
        </label>
      </div>

      <div className="coupon-section">
        <h3>Apply Coupon</h3>
        <input type="text" value={couponCode} onChange={(e) => setCouponCode(e.target.value)} placeholder="Enter coupon code" />
        <button type="button" onClick={handleCouponApply}>Apply</button>
      </div>

      <h3>Order Summary</h3>
      <div className="cart-items">
        {itemsToDisplay.map((item) => (
          <div key={`${item._id}-${item.ringSize || 'none'}`} className="cart-item">
            {item.product?.imageUrl ? (
              <a href={`/product/${item.product._id}`} target="_blank" rel="noopener noreferrer">
                <img 
                  src={`${BASE_URL}${item.product.imageUrl.startsWith('/') ? '' : '/'}${item.product.imageUrl}`} 
                  alt={item.product?.name || 'Product'} 
                  className="cart-item-image"
                  onError={(e) => {
                    e.target.onerror = null; 
                    e.target.src = '/placeholder-image.jpg'
                  }}
                />
              </a>
            ) : (
              <a href={`/product/${item.product._id}`} target="_blank" rel="noopener noreferrer" className="image-placeholder">
                No Image
              </a>
            )}
            <div className="cart-item-details">
              <a href={`/product/${item.product._id}`} target="_blank" rel="noopener noreferrer" style={{ textDecoration: "none" }}>
                <h3>{item.product?.name || 'Unknown Product'}</h3>
              </a>
              {item.ringSize && <p>Ring Size: {item.ringSize}</p>}
              <p>Price: ₹{item.product?.price || '0.00'}</p>
              <p>Quantity: {item.quantity}</p>
            </div>
          </div>
        ))} 
      </div>
      <p><strong>Total Price:</strong> ₹{totalPrice.toFixed(2)}</p>
      <p><strong>Discount:</strong> ₹{discount.toFixed(2)}</p>
      <p><strong>Final Price:</strong> ₹{finalPrice.toFixed(2)}</p>

      <button className="go-back-button" onClick={() => navigate("/cart")}>Go Back to Cart</button>
    </div>
  );
};

export default CheckoutPage;
