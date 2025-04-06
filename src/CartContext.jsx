import { createContext, useReducer, useContext } from "react";
import axios from "axios";

const CartContext = createContext();

const cartReducer = async (state, action) => {
  switch (action.type) {
    case "ADD_TO_CART":
      const existingProduct = state.find((item) => item._id === action.payload._id);
      if (existingProduct) {
        // Check if we're not exceeding available stock
        if (existingProduct.quantity + 1 > existingProduct.stock) {
          console.warn("Cannot add more items than available stock");
          return state;
        }
        return state.map((item) =>
          item._id === action.payload._id ? { ...item, quantity: item.quantity + 1 } : item
        );
      }
      // For new items, default to quantity 1 (will be validated at checkout)
      return [...state, { ...action.payload, quantity: 1 }];

    case "REMOVE_FROM_CART":
      return state.filter((item) => item._id !== action.payload);

    case "UPDATE_QUANTITY":
      return state.map((item) =>
        item._id === action.payload._id ? { ...item, quantity: action.payload.quantity } : item
      );

    case "CLEAR_CART":
      return [];
      
    case "CHECKOUT":
      try {
        // Update stock for all items in cart
        await Promise.all(state.map(async (item) => {
          const response = await axios.put(
            `http://localhost:5000/update-stock/${item._id}`,
            { quantity: item.quantity },
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
