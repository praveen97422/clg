import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { auth } from "./firebase";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get("http://localhost:5000/cart", {
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

  const addToCart = async (productId, quantity = 1) => {
    try {
      // Optimistic update
      setLoading(true);
      setCart(prev => [...prev, {
        _id: Date.now().toString(), // temporary ID
        product: { _id: productId },
        quantity,
        isOptimistic: true
      }]);

      const token = await getAuthToken();
      const response = await axios.post(
        "http://localhost:5000/cart",
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      
      // Replace optimistic item with server response
      setCart(prev => [
        ...prev.filter(item => !item.isOptimistic),
        ...response.data.cart
      ]);
    } catch (err) {
      // Rollback on error
      setCart(prev => prev.filter(item => !item.isOptimistic));
      setError(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    if (quantity < 1 || quantity > 10) {
      setError("Quantity must be between 1 and 10");
      return;
    }

    try {
      setLoading(true);
      // Optimistic update
      setCart(prev => prev.map(item => 
        item._id === productId 
          ? { ...item, quantity, isUpdating: true }
          : item
      ));

      const token = await getAuthToken();
      await axios.put(
        `http://localhost:5000/cart/${productId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      // Clear updating flag
      setCart(prev => prev.map(item => 
        item._id === productId 
          ? { ...item, isUpdating: false }
          : item
      ));
    } catch (err) {
      // Rollback on error
      setCart(prev => prev.map(item => 
        item._id === productId 
          ? { ...item, isUpdating: false }
          : item
      ));
      setError(
        err.response?.data?.message ||
          `Failed to update quantity: ${err.message}`
      );
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const cartItem = cart.find((item) => item._id === productId);
      if (!cartItem) {
        throw new Error("Cart item not found");
      }

      await axios.delete(
        `http://localhost:5000/cart/${cartItem.product._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
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
      await axios.delete("http://localhost:5000/cart", {
        headers: { Authorization: `Bearer ${token}` },
      });
      setCart([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  const checkout = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        "http://localhost:5000/checkout",
        {},
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

export const getAuthToken = async () => {
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

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) {
    throw new Error("useCart must be used within a CartProvider");
  }
  return context;
};
