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
  ProductDetail,
} from "./pages";

function App() {
  const [cart, setCart] = useState([]);
  const [token, setToken] = useState(null);
  const [email, setEmail] = useState(null);
  const [currentUser, setCurrentUser] = useState(null);

  useEffect(() => {
    const tokenFromStorage = localStorage.getItem("token");
    const emailFromStorage = localStorage.getItem("email");
    if (tokenFromStorage) {
      setToken(tokenFromStorage);
    }
    if (emailFromStorage) {
      setEmail(emailFromStorage);
    }
  }, []);

  console.log("App token:", token);
  console.log("App email:", email);

  const logout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("email");
    setToken(null);
    setEmail(null);
  };

  const removeFromCart = (productId) => {
    setCart((prevCart) =>
      prevCart.filter((product) => product.id !== productId)
    );
  };

  return (
    <div>
      <NavBar
        token={token}
        email={email}
        currentUser={currentUser}
        logout={logout}
      />
      <Routes>
        <Route index element={<Store setCart={setCart} />} />
        <Route
          path="/login"
          element={<Login setToken={setToken} setEmail={setEmail} />}
        />
        <Route path="/register" element={<Register setToken={setToken} />} />
        <Route
          path="/account"
          element={
            <Account
              token={token}
              currentUser={currentUser}
              setCurrentUser={setCurrentUser}
            />
          }
        />
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
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
      </Routes>
    </div>
  );
}

export default App;
