import { useEffect, useState } from "react";

const Account = () => {
  const [user, setUser] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [username, setUsername] = useState(""); // Initialize to empty string
  const [email, setEmail] = useState(""); // Initialize to empty string
  const [purchases, setPurchases] = useState([]);
  useEffect(() => {
    const token = localStorage.getItem("token"); // Get the token from local storage

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`, // Include the token in the Authorization header
    };

    // Fetch user data
    fetch("http://localhost:3000/api/me", { headers })
      .then((response) => response.json())
      .then((data) => {
        setUser(data.user);
        setUsername(data.user.username || ""); // Use empty string if username is null
        setEmail(data.user.email || ""); // Use empty string if email is null
        setIsLoading(false);

        // Fetch purchase history
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

  const handleSubmit = (event) => {
    event.preventDefault();

    const token = localStorage.getItem("token"); // Get the token from local storage

    if (!token) {
      setError("No token found");
      return;
    }

    const headers = {
      Authorization: `Bearer ${token}`, // Include the token in the Authorization header
      "Content-Type": "application/json",
    };

    // Send a PUT request to the server with the updated user data
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
      .then((data) => setUser(data.user))
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
      <p>Username: {user.username}</p>
      <p>Email: {user.email}</p>
      <h3>Purchase History</h3>
      <ul>
        {purchases.map((purchase) => (
          <li key={purchase.id}>
            {purchase.product_name} - {purchase.quantity}
          </li>
        ))}
      </ul>
      <h3>Update Account</h3>
      <form onSubmit={handleSubmit}>
        <label>
          Username:
          <input
            type="text"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
          />
        </label>
        <label>
          Email:
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </label>
        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default Account;
