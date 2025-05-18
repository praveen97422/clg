import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./auth/AuthContext.jsx";
import { BASE_URL } from "./apiConfig.js";
import { FaSearch } from "react-icons/fa";
import "./styles/OrdersPage.css";

export default function AdminOrdersPage() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [emailStatus, setEmailStatus] = useState({}); // Track email send status per order
  const [trackingInputs, setTrackingInputs] = useState({}); // Track tracking ID inputs per order
  const [trackingStatus, setTrackingStatus] = useState({}); // Track tracking update status per order
  const [searchQuery, setSearchQuery] = useState("");
  const [statusUpdateStatus, setStatusUpdateStatus] = useState({});

  const fetchOrders = async () => {
    try {
      if (!user || !user.token) {
        setError("Admin not authenticated");
        setLoading(false);
        return;
      }
      const token = user.token;
      const response = await axios.get(`${BASE_URL}/orders/admin`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.success) {
        setOrders(response.data.orders);
        setFilteredOrders(response.data.orders);
        // Initialize trackingInputs with existing tracking IDs
        const initialTracking = {};
        response.data.orders.forEach(order => {
          initialTracking[order._id] = order.trackingId || "";
        });
        setTrackingInputs(initialTracking);
      } else {
        setError("Failed to fetch orders");
      }
    } catch (err) {
      setError("Error fetching orders");
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    
    if (!query.trim()) {
      setFilteredOrders(orders);
      return;
    }

    const filtered = orders.filter(order => 
      order._id.toLowerCase().includes(query) ||
      order.userDetails.name.toLowerCase().includes(query)
    );
    setFilteredOrders(filtered);
  };

  const sendOrderEmail = async (orderId) => {
    try {
      setEmailStatus(prev => ({ ...prev, [orderId]: "sending" }));
      const token = user.token;
      const response = await axios.post(`${BASE_URL}/orders/${orderId}/send-email`, {}, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.success) {
        setEmailStatus(prev => ({ ...prev, [orderId]: "sent" }));
      } else {
        setEmailStatus(prev => ({ ...prev, [orderId]: "failed" }));
      }
    } catch (error) {
      setEmailStatus(prev => ({ ...prev, [orderId]: "failed" }));
    }
  };

  const updateTrackingId = async (orderId) => {
    try {
      setTrackingStatus(prev => ({ ...prev, [orderId]: "updating" }));
      const token = user.token;
      const trackingId = trackingInputs[orderId];
      const response = await axios.put(`${BASE_URL}/orders/${orderId}/tracking`, { trackingId }, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data && response.data.success) {
        setTrackingStatus(prev => ({ ...prev, [orderId]: "updated" }));
        // Refresh orders to get updated tracking IDs
        fetchOrders();
      } else {
        setTrackingStatus(prev => ({ ...prev, [orderId]: "failed" }));
      }
    } catch (error) {
      setTrackingStatus(prev => ({ ...prev, [orderId]: "failed" }));
    }
  };

  const handleTrackingInputChange = (orderId, value) => {
    setTrackingInputs(prev => ({ ...prev, [orderId]: value }));
  };

  const updateOrderStatus = async (orderId) => {
    try {
      setStatusUpdateStatus(prev => ({ ...prev, [orderId]: "updating" }));
      const token = user.token;
      const response = await axios.put(
        `${BASE_URL}/orders/${orderId}/status`,
        { status: "Delivered" },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data && response.data.success) {
        setStatusUpdateStatus(prev => ({ ...prev, [orderId]: "updated" }));
        // Refresh orders to get updated status
        fetchOrders();
      } else {
        setStatusUpdateStatus(prev => ({ ...prev, [orderId]: "failed" }));
      }
    } catch (error) {
      setStatusUpdateStatus(prev => ({ ...prev, [orderId]: "failed" }));
    }
  };

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

  useEffect(() => {
    fetchOrders();
  }, [user]);

  if (loading) return <p>Loading orders...</p>;
  if (error) return <p>{error}</p>;
  if (orders.length === 0) return <p>No orders found.</p>;

  return (
    <div className="admin-orders-container">
      <h2>All Orders</h2>
      
      {/* Search Bar */}
      <div className="admin-orders-search-container">
        <div className="admin-orders-search-box">
          <FaSearch className="admin-orders-search-icon" />
          <input
            type="text"
            placeholder="Search by Order ID or User Name..."
            value={searchQuery}
            onChange={handleSearch}
            className="admin-orders-search-input"
          />
        </div>
      </div>

      {filteredOrders.map((order) => (
        <div key={order._id} className="order-card">
          <h3>Order ID: {order._id}</h3>
          <p>User: {order.userDetails.name} ({order.userEmail})</p>
          <p>Phone: {order.userDetails.phoneNumber}</p>
          <p>Address: {order.userDetails.address}</p>
          {order.userDetails.additionalPhoneNumber && <p>Additional Phone: {order.userDetails.additionalPhoneNumber}</p>}
          <p>
            Status: <span className={getStatusClass(order.status)}>{order.status}</span>
          </p>
          <p>Placed on: {new Date(order.createdAt).toLocaleString()}</p>
          <p>Total Amount: ₹{order.totalAmount.toFixed(2)}</p>
          <h4>Items:</h4>
          <ul>
            {order.items.map((item, index) => (
              <li key={typeof item.productId === 'string' ? item.productId : index}>
                {item.name || "Unnamed Product"} - Qty: {item.quantity} {item.ringSize ? `(Ring Size: ${item.ringSize})` : ""}
              </li>
            ))}
          </ul>
          <div className="order-actions">
            <div className="tracking-section">
              <label htmlFor={`tracking-${order._id}`}>Tracking ID: </label>
              <input
                id={`tracking-${order._id}`}
                type="text"
                value={trackingInputs[order._id] || ""}
                onChange={(e) => handleTrackingInputChange(order._id, e.target.value)}
                placeholder="Enter tracking ID"
              />
              <button
                onClick={() => updateTrackingId(order._id)}
                disabled={trackingStatus[order._id] === "updating"}
              >
                {trackingStatus[order._id] === "updating"
                  ? "Updating..."
                  : trackingStatus[order._id] === "updated"
                  ? "Updated"
                  : trackingStatus[order._id] === "failed"
                  ? "Retry Update"
                  : "Update Tracking ID"}
              </button>
            </div>
            <div className="action-buttons">
              <button
                onClick={() => sendOrderEmail(order._id)}
                disabled={emailStatus[order._id] === "sending"}
                className="email-button"
              >
                {emailStatus[order._id] === "sending"
                  ? "Sending Email..."
                  : emailStatus[order._id] === "sent"
                  ? "Email Sent"
                  : emailStatus[order._id] === "failed"
                  ? "Retry Send Email"
                  : "Send Email"}
              </button>
              {order.status.toLowerCase() !== "delivered" && (
                <button
                  onClick={() => updateOrderStatus(order._id)}
                  disabled={statusUpdateStatus[order._id] === "updating"}
                  className="delivery-button"
                >
                  {statusUpdateStatus[order._id] === "updating"
                    ? "Updating..."
                    : statusUpdateStatus[order._id] === "updated"
                    ? "Delivered"
                    : statusUpdateStatus[order._id] === "failed"
                    ? "Retry Delivery"
                    : "Mark as Delivered"}
                </button>
              )}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
