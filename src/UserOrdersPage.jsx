import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./auth/AuthContext.jsx";
import { BASE_URL } from "./apiConfig.js";
import "./styles/OrdersPage.css";

export default function UserOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchOrders = async () => {
    try {
      if (!user || !user.token) {
        setError("User not authenticated");
        setLoading(false);
        return;
      }
      const token = user.token;
      const response = await axios.get(`${BASE_URL}/orders/user`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.success) {
        setOrders(response.data.orders);
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err) {
      setError("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [user]);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>{error}</p>;
  if (orders.length === 0) return <p className="no-orders-message">No orders found.</p>;

  const getStatusClass = (status) => {
    switch (status.toLowerCase()) {
      case "pending":
        return "status-badge status-pending";
      case "delivered":
        return "status-badge status-completed";
      case "cancelled":
        return "status-badge status-cancelled";
      default:
        return "status-badge";
    }
  };

  return (
    <div className="order-container">
      <h2>Your Orders</h2>
      {orders.map((order) => (
        <div key={order._id} className="order-card">
          <h3>Order ID: {order._id}</h3>
          <span className={getStatusClass(order.status)}>{order.status}</span>
          <p>Placed on: {new Date(order.createdAt).toLocaleString()}</p>
          <p>Total Amount: ₹{order.totalAmount.toFixed(2)}</p>
          {order.trackingId && (
            <p><strong>Tracking ID:</strong> {order.trackingId}</p>
          )}
          <h4>Items:</h4>
          <ul>
            {order.items.map((item, index) => (
              <li key={typeof item.productId === 'string' ? item.productId : index}>
                {item.name || "Unnamed Product"} - Qty: {item.quantity} {item.ringSize ? `(Ring Size: ${item.ringSize})` : ""}
              </li>
            ))}
          </ul>
        </div>
      ))}
    </div>
  );
}
