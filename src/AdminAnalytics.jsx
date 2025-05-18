import React, { useEffect, useState } from "react";
import axios from "axios";
import { useAuth } from "./auth/AuthContext.jsx";
import { BASE_URL } from "./apiConfig.js";
import "./styles/AdminAnalytics.css";

export default function AdminAnalytics() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [analytics, setAnalytics] = useState({
    topProducts: [],
    topCategories: [],
    totalOrders: 0,
    totalRevenue: 0,
    recentOrders: []
  });

  const fetchAnalytics = async () => {
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
        const orders = response.data.orders;
        
        // Calculate analytics
        const productSales = {};
        const categorySales = {};
        let totalRevenue = 0;
        
        orders.forEach(order => {
          totalRevenue += order.totalAmount;
          
          order.items.forEach(item => {
            // Product sales
            if (!productSales[item.name]) {
              productSales[item.name] = {
                name: item.name,
                quantity: 0,
                revenue: 0
              };
            }
            productSales[item.name].quantity += item.quantity;
            productSales[item.name].revenue += item.price * item.quantity;
            
            // Category sales (assuming category is stored in the product)
            const category = item.category || 'Uncategorized';
            if (!categorySales[category]) {
              categorySales[category] = {
                name: category,
                quantity: 0,
                revenue: 0
              };
            }
            categorySales[category].quantity += item.quantity;
            categorySales[category].revenue += item.price * item.quantity;
          });
        });
        
        // Sort and get top products and categories
        const topProducts = Object.values(productSales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
          
        const topCategories = Object.values(categorySales)
          .sort((a, b) => b.quantity - a.quantity)
          .slice(0, 5);
        
        setAnalytics({
          topProducts,
          topCategories,
          totalOrders: orders.length,
          totalRevenue,
          recentOrders: orders.slice(0, 5) // Get 5 most recent orders
        });
      }
    } catch (err) {
      setError("Error fetching analytics data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAnalytics();
  }, [user]);

  if (loading) return <div className="analytics-container">Loading analytics...</div>;
  if (error) return <div className="analytics-container error">{error}</div>;

  return (
    <div className="analytics-container">
      <h2>Sales Analytics</h2>
      
      <div className="analytics-summary">
        <div className="summary-card">
          <h3>Total Orders</h3>
          <p>{analytics.totalOrders}</p>
        </div>
        <div className="summary-card">
          <h3>Total Revenue</h3>
          <p>₹{analytics.totalRevenue.toFixed(2)}</p>
        </div>
      </div>

      <div className="analytics-grid">
        <div className="analytics-card">
          <h3>Top Selling Products</h3>
          <div className="list-container">
            {analytics.topProducts.map((product, index) => (
              <div key={index} className="list-item">
                <span className="rank">{index + 1}</span>
                <span className="name">{product.name}</span>
                <span className="quantity">Qty: {product.quantity}</span>
                <span className="revenue">₹{product.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3>Top Categories</h3>
          <div className="list-container">
            {analytics.topCategories.map((category, index) => (
              <div key={index} className="list-item">
                <span className="rank">{index + 1}</span>
                <span className="name">{category.name}</span>
                <span className="quantity">Qty: {category.quantity}</span>
                <span className="revenue">₹{category.revenue.toFixed(2)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="analytics-card">
          <h3>Recent Orders</h3>
          <div className="list-container">
            {analytics.recentOrders.map((order) => (
              <div key={order._id} className="list-item">
                <span className="order-id">Order #{order._id.slice(-6)}</span>
                <span className="date">{new Date(order.createdAt).toLocaleDateString()}</span>
                <span className="amount">₹{order.totalAmount.toFixed(2)}</span>
                <span className={`status ${order.status.toLowerCase()}`}>{order.status}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
} 