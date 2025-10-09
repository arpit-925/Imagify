import { createContext, useState, useEffect } from "react";
import { toast } from "react-toastify";
import axios from "axios";
import { useNavigate } from "react-router-dom";


export const AppContext = createContext();

const AppContextProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [showLogin, setShowLogin] = useState(false);
  const [token, setToken] = useState(localStorage.getItem("token"));
  const [credit, setCredit] = useState(0);

  const backendUrl = import.meta.env.VITE_BACKEND_URL;
  const navigate = useNavigate()

  const loadCreditsData = async () => {
    if (!token) return;

    try {
      const { data } = await axios.get(`${backendUrl}/api/users/credits`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (data.success) {
        setCredit(data.credits);
        setUser(data.user);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || err.message);
    }
  };

  //load image by prompt 
  const generateImage = async (prompt) => {
  try {
    const { data } = await axios.post(
      `${backendUrl}/api/image/generate-image`,
      { prompt },
      { headers: { Authorization: `Bearer ${token}` } } // ✅ use proper Authorization header
    );

    if (data.success) {
      loadCreditsData();
      return data.resultImage;
    } else {
      toast.error(data.message);
      loadCreditsData();

      if (data.creditBalance === 0) {
        navigate("/buy");
      }
    }
  } catch (error) {
    console.error("Error generating image:", error);
    toast.error(error.response?.data?.message || "Something went wrong");
  }
};


  const logout = () => {
    localStorage.removeItem("token");
    setToken("");
    setUser(null);
  };

  useEffect(() => {
    if (token) loadCreditsData();
  }, [token]);

  return (
    <AppContext.Provider value={{
      user, setUser, showLogin, setShowLogin, backendUrl, token, setToken,
      credit, setCredit, loadCreditsData, logout, generateImage
    }}>
      {children}
    </AppContext.Provider>
  );
};

export default AppContextProvider;
