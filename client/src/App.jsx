// Importing necessary hooks and components from React and react-router-dom
import { useContext, useState, useEffect } from "react";
import { Routes, Route, useNavigate } from "react-router-dom";
// Importing your custom components
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
// Importing the UserContext from UserProvider
import { UserContext } from "./pages/UserProvider";

// The main App component
function App() {
  // State for the cart, initially an empty array
  const [cart, setCart] = useState([]);
  // Function to update the cart
  const updateCart = (newCart) => {
    console.log("Updating cart with:", newCart);
    setCart(newCart);
  };

  // The component returns the UserProvider wrapping all other components
  // and the Routes for the different pages of the app
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

// The AccountPage component
function AccountPage() {
  // Getting the user from the UserContext
  const { user } = useContext(UserContext);
  // Getting the navigate function from useNavigate
  const navigate = useNavigate();

  // useEffect hook to navigate to the AdminAccount page if the user is an admin
  useEffect(() => {
    if (user && user.role === "admin") {
      console.log("User is admin, navigating to AdminAccount");
      navigate("/AdminAccount");
    }
  }, [user, navigate]);

  // If the user is an admin, render the AdminAccount component, otherwise render the Account component
  return user && user.role === "admin" ? <AdminAccount /> : <Account />;
}

// Exporting the App component as default
export default App;
