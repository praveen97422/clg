import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";

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
        headers: { Authorization: `Bearer ${token}` }
      });
      setCart(response.data.cart);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch cart");
    } finally {
      setLoading(false);
    }
  };

  const addToCart = async (productId, quantity = 1) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.post(
        "http://localhost:5000/cart",
        { productId, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(response.data.cart);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add to cart");
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId, quantity) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.put(
        `http://localhost:5000/cart/${productId}`,
        { quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(response.data.cart);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update quantity");
    } finally {
      setLoading(false);
    }
  };

  const removeFromCart = async (productId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.delete(
        `http://localhost:5000/cart/${productId}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart(response.data.cart);
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
      const response = await axios.delete(
        "http://localhost:5000/cart",
        { headers: { Authorization: `Bearer ${token}` } }
      );
      setCart([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear cart");
    } finally {
      setLoading(false);
    }
  };

  const getAuthToken = async () => {
    // Get Firebase auth token
    const user = auth.currentUser;
    if (!user) throw new Error("User not authenticated");
    return await user.getIdToken();
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
        fetchCart
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
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
          if (!response.data?.success) {
            throw new Error(`Failed to update stock for ${item._id}`);
          }
        }));
        return []; // Clear cart on successful checkout
      } catch (error) {
        console.error("Checkout failed:", error);
        // Return current state if checkout fails
        return state;
      }

    default:
      return state;
  }
};

export const CartProvider = ({ children }) => {
  // Load initial state from localStorage
  const getInitialCart = () => {
    try {
      const savedCart = localStorage.getItem('cart');
      return savedCart ? JSON.parse(savedCart) : [];
    } catch (error) {
      console.error('Failed to load cart from localStorage:', error);
      return [];
    }
  };

  const [cart, _dispatch] = useReducer((state, action) => {
    if (action.type === 'UPDATE_STATE') {
      // Save to localStorage whenever state changes
      try {
        localStorage.setItem('cart', JSON.stringify(action.payload));
      } catch (error) {
        console.error('Failed to save cart to localStorage:', error);
      }
      return action.payload;
    }
    return state;
  }, getInitialCart());

  const dispatch = async (action) => {
    const newState = await cartReducer(cart, action);
    _dispatch({ type: 'UPDATE_STATE', payload: newState });
  };

  return (
    <CartContext.Provider value={{ cart, dispatch }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
