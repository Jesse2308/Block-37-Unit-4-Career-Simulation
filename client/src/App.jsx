import { useContext, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";

import {
  NavBar,
  Store,
  Login,
  Register,
  Account,
  Cart,
  Checkout,
  ProductDetail,
  UserProvider,
  AdminAccount,
} from "./pages";

import { UserContext } from "./pages/UserProvider";

function App() {
  return (
    <UserProvider>
      <NavBar />
      <Routes>
        <Route index element={<Store />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/account" element={<AccountPage />} />
        <Route path="/cart" element={<Cart />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/AdminAccount" element={<AdminAccount />} />
      </Routes>
    </UserProvider>
  );
}

function AccountPage() {
  const { user } = useContext(UserContext);
  const navigate = useNavigate();

  useEffect(() => {
    if (user && user.role === "admin") {
      navigate("/AdminAccount");
    }
  }, [user, navigate]);

  return user && user.role === "admin" ? <AdminAccount /> : <Account />;
}

export default App;
