import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { auth } from "./firebase";
import { BASE_URL } from "./apiConfig.js";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedCart = response.data.cart.map((item) => {
        const productDetails = item.productId?._doc || item.productId || {};
        return {
          ...item,
          product: productDetails,
          quantity: item.quantity,
        };
      });

      setCart(formattedCart);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1, ringSize = null) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const requestBody = { productId, quantity };
      if (ringSize) {
        requestBody.ringSize = ringSize;
      }
      const response = await axios.post(
        `${BASE_URL}/cart`,
        requestBody,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchCart();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (cartItemId, quantity, ringSize = null) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const cartItem = cart.find((item) => item._id === cartItemId);
      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      await axios.put(
        `${BASE_URL}/cart/${cartItem.product._id}`,
        { quantity, ringSize },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchCart();
    } catch (err) {
      setError(
        err.response?.data?.message ||
          `Failed to update quantity: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (cartItemId, ringSize = null) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const cartItem = cart.find((item) => item._id === cartItemId);
      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      const url = ringSize ? `${BASE_URL}/cart/${cartItem.product._id}?ringSize=${encodeURIComponent(ringSize)}` : `${BASE_URL}/cart/${cartItem.product._id}`;

      await axios.delete(
        url,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      await fetchCart();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove from cart");
    } finally {
      setLoading(false);
    }
  };

  const clearCart = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      await axios.delete(`${BASE_URL}/cart`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  const checkout = async (orderData) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        `${BASE_URL}/checkout`,
        orderData,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart([]);
      return response.data;
    } catch (err) {
      setError(err.response?.data?.message || "Checkout failed");
      throw err;
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    try {
      const user = auth.currentUser;
      if (!user) {
        throw new Error("User not authenticated");
      }
      return await user.getIdToken();
    } catch (error) {
      throw error;
    }
  };

  useEffect(() => {
    fetchCart();
  }, []);

  return (
    <CartContext.Provider
      value={{
        cart,
        loading,
        error,
        addToCart,
        updateQuantity,
        removeFromCart,
        clearCart,
        fetchCart,
        checkout,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
