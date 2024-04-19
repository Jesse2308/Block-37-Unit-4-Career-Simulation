import { useState, useEffect } from "react";
const BASE_URL = "http://localhost:3000";

const AdminAccount = () => {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");

  const fetchProducts = async () => {
    // Fetch products from your API and update the products state
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const fetchUsersFromServer = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log(response); // Log the response

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchUsersFromServer();
  }, []);

  const handleAddProduct = async (newProduct) => {
    try {
      const response = await fetch(`${BASE_URL}/api/admin/products`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(newProduct),
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts((prevProducts) => [...prevProducts, data]);
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleDeleteProduct = async (productId) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/admin/products/${productId}`,
        {
          method: "DELETE",
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setProducts((prevProducts) =>
        prevProducts.filter((product) => product.id !== productId)
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };
  const handleUpdateProductName = async (productId, newName) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/admin/products/${productId}/name`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ name: newName }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId ? data : product
        )
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };

  const handleUpdateProductPrice = async (productId, newPrice) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/admin/products/${productId}/price`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ price: newPrice }),
        }
      );
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts((prevProducts) =>
        prevProducts.map((product) =>
          product.id === productId ? data : product
        )
      );
    } catch (error) {
      console.error("Error:", error);
    }
  };

  return (
    <div>
      <h1>Welcome, Admin!</h1>

      <h2>Products</h2>
      {/* Display all products and provide forms for adding, editing, and deleting products */}
      {products.map((product) => (
        <div key={product.id}>
          <p>Name: {product.name}</p>
          <p>Price: {product.price}</p>
          <form onSubmit={() => handleUpdateProductName(product.id)}>
            <input
              type="text"
              placeholder="New product name"
              onChange={(e) => setNewProductName(e.target.value)}
            />
            <button type="submit">Update Name</button>
          </form>
          <form onSubmit={() => handleUpdateProductPrice(product.id)}>
            <input
              type="number"
              placeholder="New product price"
              onChange={(e) => setNewProductPrice(e.target.value)}
            />
            <button type="submit">Update Price</button>
          </form>
          <button onClick={() => handleDeleteProduct(product.id)}>
            Delete
          </button>
        </div>
      ))}
      <h3>Add Product</h3>
      <form onSubmit={handleAddProduct}>
        <input
          type="text"
          placeholder="Product name"
          value={newProductName}
          onChange={(e) => setNewProductName(e.target.value)}
        />
        <input
          type="number"
          placeholder="Product price"
          value={newProductPrice}
          onChange={(e) => setNewProductPrice(e.target.value)}
        />
        <button type="submit">Add Product</button>
      </form>

      <h2>Users</h2>
      {/* Display all users */}
      {users.map((user, index) => (
        <div key={index}>
          <p>Email: {user.email}</p>
          <p>Username: {user.username}</p>
        </div>
      ))}
    </div>
  );
};

export default AdminAccount;
