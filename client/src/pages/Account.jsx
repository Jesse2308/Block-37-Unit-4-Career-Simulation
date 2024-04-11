import { useEffect, useState } from "react";

const Account = ({ currentUser, setCurrentUser }) => {
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState("");
  const [email, setEmail] = useState("");
  const [purchases, setPurchases] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
    };

    fetch("http://localhost:3000/api/me", { headers })
      .then((response) => response.json())
      .then((data) => {
        setCurrentUser(data.user);
        setUsername(data.user.username || "");
        setEmail(data.user.email || "");
        setIsLoading(false);

        fetch(`http://localhost:3000/api/orders/${data.user.id}`, { headers })
          .then((response) => {
            if (!response.ok) {
              throw new Error(`HTTP error! status: ${response.status}`);
            }
            return response.json();
          })
          .then((data) => setPurchases(data))
          .catch((error) => setError(error.message));
      })
      .catch((error) => {
        setError(error.message);
        setIsLoading(false);
      });
  }, []);

  const handleUpdateAccount = async (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token");

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
    };

    fetch("http://localhost:3000/api/user", {
      method: "PUT",
      headers,
      body: JSON.stringify({ username, email }),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        return response.json();
      })
      .then((data) => setCurrentUser(data.user))
      .catch((error) => setError(error.message));
  };

  if (isLoading) {
    return <div>Loading...</div>;
  }

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div>
      <h2>Account</h2>
      <p>Welcome, {currentUser.username}</p>
      <p>Email: {currentUser.email}</p>
      <h3>Purchase History</h3>
      <ul>
        {purchases.map((purchase) => (
          <li key={purchase.id}>
            {purchase.product_name} - {purchase.quantity}
          </li>
        ))}
      </ul>
      <h3>Update Account</h3>
      <form onSubmit={handleUpdateAccount}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default Account;
