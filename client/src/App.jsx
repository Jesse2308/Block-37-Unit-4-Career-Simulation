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
  Admin,
  UserProvider,
} from "./pages";

function App() {
  const [cart, setCart] = useState([]);
  const updateCart = (newCart) => {
    setCart(newCart);
  };

  return (
    <UserProvider>
      <NavBar cart={cart} />
      <Routes>
        <Route
          index
          element={<Store updateCart={updateCart} setCart={setCart} />}
        />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<Account />} />
        <Route path="/cart" element={<Cart setCart={setCart} />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
      </Routes>
    </UserProvider>
  );
}

export default App;
