import { Routes, Route } from 'react-router-dom'
import { useState } from "react";
import { NavBar, Store, Login, Register, Account } from "./pages";

function App() {
  const [token, setToken] = useState(null); 
  return (
    <div>
      <NavBar />
      <Routes>
        <Route path="/" element={<Store />} />
        <Route path="/login" element={<Login setToken={setToken} />} />
        <Route path="/register" element={<Register setToken={setToken} />} />
        <Route path="/account" element={<Account token={token} />} />
      </Routes>
    </div>
  );
}

export default App;