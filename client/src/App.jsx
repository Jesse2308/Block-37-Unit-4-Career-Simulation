import { Routes, Route } from "react-router-dom";
import { useState, useEffect } from "react";
import {
  NavBar,
  Store,
  Login,
  Register,
  Account,
  Cart,
  Checkout,
} from "./pages";

function App() {
  const [cart, setCart] = useState([]);
  const [token, setToken] = useState(null);
  const [username, setUsername] = useState(null);

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("token");
    const usernameFromStorage = localStorage.getItem("username");
    if (tokenFromStorage) {
      setToken(tokenFromStorage);
    }
    if (usernameFromStorage) {
      setUsername(usernameFromStorage);
    }
  }, []);

  console.log("App token:", token); // Add this line
  console.log("App username:", username); // Add this line

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("username");
    setToken(null);
    setUsername(null);
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart.filter((product) => product.id !== productId)
    );
  };

  return (
    <div>
      <NavBar token={token} username={username} logout={logout} />
      <Routes>
        <Route index element={<Store setCart={setCart} />} />
        <Route
          path="/login"
          element={<Login setToken={setToken} setUsername={setUsername} />}
        />
        <Route path="/register" element={<Register setToken={setToken} />} />
        <Route path="/account" element={<Account token={token} />} />
        <Route
          path="/cart"
          element={
            <Cart
              cart={cart}
              removeFromCart={removeFromCart}
              setCart={setCart}
            />
          }
        />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </div>
  );
}

export default App;
