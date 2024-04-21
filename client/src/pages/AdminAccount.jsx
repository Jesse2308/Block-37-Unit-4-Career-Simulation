import { useState, useEffect } from "react";
import "./AdminAccount.css";
const BASE_URL = "http://localhost:3000";

const AdminAccount = () => {
  // State variables for products, users, and new product details
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [newProductName, setNewProductName] = useState("");
  const [newProductPrice, setNewProductPrice] = useState("");
  const [newProductImage, setNewProductImage] = useState(""); // New state variable for new product image

  // Fetch products from the API
  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
      console.log("Fetched products:", data); // Log the fetched products
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };
  // Fetch users from the API
  const fetchUsersFromServer = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${BASE_URL}/api/admin/users`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      console.log("Response from fetching users:", response); // Log the response

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
      console.log("Fetched users:", data); // Log the fetched users
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Fetch products and users when the component mounts
  useEffect(() => {
    fetchProducts();
    fetchUsersFromServer();
  }, []);

  // Add a new product
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
      console.log("Added product:", data); // Log the added product
    } catch (error) {
      console.error("Error adding product:", error);
    }
  };

  // Delete a product
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
      console.log("Deleted product with id:", productId); // Log the id of the deleted product
    } catch (error) {
      console.error("Error deleting product:", error);
    }
  };

  // Update a product's name
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
      console.log("Updated product name:", data); // Log the product with the updated name
    } catch (error) {
      console.error("Error updating product name:", error);
    }
  };

  // Update a product's price
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
      console.log("Updated product price:", data); // Log the product with the updated price
    } catch (error) {
      console.error("Error updating product price:", error);
    }
  };

  // Update a product's image
  const handleUpdateProductImage = async (productId, newImage) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/admin/products/${productId}/image`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ image: newImage }),
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
      console.log("Updated product image:", data); // Log the product with the updated image
    } catch (error) {
      console.error("Error updating product image:", error);
    }
  };

  // Render the component
  return (
    <div className="admin-account">
      <h1 className="admin-welcome">Welcome, Admin!</h1>

      <div className="products-container">
        <h2 className="products-title">Products</h2>
        {/* Display all products and provide forms for adding, editing, and deleting products */}
        {products.map((product) => (
          <div key={product.id} className="product">
            <img
              src={product.image}
              alt={product.name}
              className="product-image"
            />
            <p>Name: {product.name}</p>
            <p>Price: {product.price}</p>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProductName(product.id, newProductName);
              }}
              className="update-name-form"
            >
              <input
                type="text"
                placeholder="New product name"
                onChange={(e) => setNewProductName(e.target.value)}
                className="update-name-input"
              />
              <button type="submit" className="update-name-button">
                Update Name
              </button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProductPrice(product.id, newProductPrice);
              }}
              className="update-price-form"
            >
              <input
                type="number"
                placeholder="New product price"
                onChange={(e) => setNewProductPrice(e.target.value)}
                className="update-price-input"
              />
              <button type="submit" className="update-price-button">
                Update Price
              </button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProductImage(product.id, newProductImage);
              }}
              className="update-image-form"
            >
              <input
                type="text"
                placeholder="New product image URL"
                onChange={(e) => setNewProductImage(e.target.value)}
                className="update-image-input"
              />
              <button type="submit" className="update-image-button">
                Update Image
              </button>
            </form>
            <button
              onClick={() => handleDeleteProduct(product.id)}
              className="delete-button"
            >
              Delete
            </button>
          </div>
        ))}
      </div>

      <div className="add-product-container">
        <h2 className="add-product-title">Add Product</h2>
        <form onSubmit={handleAddProduct} className="add-product-form">
          <input
            type="text"
            placeholder="Product name"
            value={newProductName}
            onChange={(e) => setNewProductName(e.target.value)}
            className="add-product-name-input"
          />
          <input
            type="number"
            placeholder="Product price"
            value={newProductPrice}
            onChange={(e) => setNewProductPrice(e.target.value)}
            className="add-product-price-input"
          />
          <input
            type="text"
            placeholder="Product image URL"
            value={newProductImage}
            onChange={(e) => setNewProductImage(e.target.value)}
            className="add-product-image-input"
          />
          <button type="submit" className="add-product-button">
            Add Product
          </button>
        </form>
      </div>

      <div className="users-container">
        <h2 className="users-title">Users</h2>
        {/* Display all users */}
        {users.map((user, index) => (
          <div key={index} className="user">
            <p className="user-email">Email: {user.email}</p>
            <p className="user-username">Username: {user.username}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default AdminAccount;
