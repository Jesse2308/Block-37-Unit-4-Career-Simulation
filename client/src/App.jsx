import { useContext, useState, useEffect } from "react";
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
  Admin,
  UserProvider,
  AdminAccount,
} from "./pages";
import { UserContext } from "./pages/UserProvider";

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
        <Route path="/account" element={<AccountPage />} />
        <Route path="/cart" element={<Cart setCart={setCart} />} />
        <Route path="/products/:id" element={<ProductDetail />} />
        <Route path="/checkout" element={<Checkout />} />
        <Route path="/admin" element={<Admin />} />
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
