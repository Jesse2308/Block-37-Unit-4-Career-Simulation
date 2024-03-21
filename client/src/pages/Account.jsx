import { useState, useEffect } from 'react';

const Account = () => {
  const [user, setUser] = useState(null);
  const [purchases, setPurchases] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchAccountData = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const userResponse = await fetch('http://localhost:3000/api/user');
        const purchasesResponse = await fetch('http://localhost:3000/api/purchases');
        if (!userResponse.ok || !purchasesResponse.ok) {
          throw new Error('Failed to fetch account data');
        }
        const userData = await userResponse.json();
        const purchasesData = await purchasesResponse.json();
        setUser(userData);
        setPurchases(purchasesData);
      } catch (error) {
        setError(error.message);
      } finally {
        setIsLoading(false);
      }
    };

    fetchAccountData();
  }, []);

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
      {purchases.map((purchase) => (
        <div key={purchase.id}>
          <p>Product: {purchase.productName}</p>
          <p>Date: {new Date(purchase.date).toLocaleDateString()}</p>
        </div>
      ))}
    </div>
  );
};

export default Account;