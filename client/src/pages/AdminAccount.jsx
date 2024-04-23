import { useState, useEffect } from "react";
import "./AdminAccount.css";
const BASE_URL = "http://localhost:3000";

const AdminAccount = () => {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const [newProduct, setNewProduct] = useState({
    name: "",
    price: "",
    image: "",
  });

  const fetchProducts = async () => {
    try {
      const response = await fetch(`${BASE_URL}/api/products`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const data = await response.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
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

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const data = await response.json();
      setUsers(data);
    } catch (error) {
      console.error("Error fetching users:", error);
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
      console.error("Error adding product:", error);
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
      console.error("Error deleting product:", error);
    }
  };

  const handleUpdateProduct = async (productId, field, newValue) => {
    try {
      const response = await fetch(
        `${BASE_URL}/api/admin/products/${productId}/${field}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ [field]: newValue }),
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
      console.error(`Error updating product ${field}:`, error);
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
                handleUpdateProduct(product.id, "name", newProduct.name);
              }}
              className="update-name-form"
            >
              <input
                type="text"
                placeholder="New product name"
                onChange={(e) =>
                  setNewProduct({ ...newProduct, name: e.target.value })
                }
                className="update-name-input"
              />
              <button type="submit" className="update-name-button">
                Update Name
              </button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProduct(product.id, "price", newProduct.price);
              }}
              className="update-price-form"
            >
              <input
                type="number"
                placeholder="New product price"
                onChange={(e) =>
                  setNewProduct({ ...newProduct, price: e.target.value })
                }
                className="update-price-input"
              />
              <button type="submit" className="update-price-button">
                Update Price
              </button>
            </form>
            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleUpdateProduct(product.id, "image", newProduct.image);
              }}
              className="update-image-form"
            >
              <input
                type="text"
                placeholder="New product image URL"
                onChange={(e) =>
                  setNewProduct({ ...newProduct, image: e.target.value })
                }
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
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleAddProduct(newProduct);
            setNewProduct({ name: "", price: "", image: "" });
          }}
          className="add-product-form"
        >
          <input
            type="text"
            placeholder="Product name"
            value={newProduct.name}
            onChange={(e) =>
              setNewProduct({ ...newProduct, name: e.target.value })
            }
            className="add-product-name-input"
          />
          <input
            type="number"
            placeholder="Product price"
            value={newProduct.price}
            onChange={(e) =>
              setNewProduct({ ...newProduct, price: e.target.value })
            }
            className="add-product-price-input"
          />
          <input
            type="text"
            placeholder="Product image URL"
            value={newProduct.image}
            onChange={(e) =>
              setNewProduct({ ...newProduct, image: e.target.value })
            }
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
