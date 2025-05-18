import { createContext, useContext, useEffect, useState } from "react";
import axios from "axios";
import { BASE_URL } from "./apiConfig.js";
import { auth } from "./firebase";

const WishlistContext = createContext();

export const WishlistProvider = ({ children }) => {
  const [wishlist, setWishlist] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchWishlist = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const response = await axios.get(`${BASE_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      const formattedWishlist = response.data.wishlist.map((item) => {
        const productDetails = item.productId?._doc || item.productId || {};
        return {
          ...item,
          product: productDetails,
        };
      });

      setWishlist(formattedWishlist);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to fetch wishlist");
    } finally {
      setLoading(false);
    }
  };

  const addToWishlist = async (productId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      await axios.post(
        `${BASE_URL}/wishlist`,
        { productId },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      await fetchWishlist();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to add to wishlist");
    } finally {
      setLoading(false);
    }
  };

  const removeFromWishlist = async (productId) => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      const wishlistItem = wishlist.find((item) => item._id === productId);
      if (!wishlistItem) {
        throw new Error("Wishlist item not found");
      }

      await axios.delete(
        `${BASE_URL}/wishlist/${wishlistItem.product._id}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );

      await fetchWishlist();
    } catch (err) {
      setError(err.response?.data?.message || "Failed to remove from wishlist");
    } finally {
      setLoading(false);
    }
  };

  const clearWishlist = async () => {
    try {
      setLoading(true);
      const token = await getAuthToken();
      await axios.delete(`${BASE_URL}/wishlist`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setWishlist([]);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to clear wishlist");
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
    fetchWishlist();
  }, []);

  return (
    <WishlistContext.Provider
      value={{
        wishlist,
        loading,
        error,
        addToWishlist,
        removeFromWishlist,
        clearWishlist,
        fetchWishlist,
      }}
    >
      {children}
    </WishlistContext.Provider>
  );
};

export const useWishlist = () => {
  const context = useContext(WishlistContext);
  if (!context) {
    throw new Error("useWishlist must be used within a WishlistProvider");
  }
  return context;
};
