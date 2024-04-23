import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const BASE_URL = "http://localhost:3000";

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  useEffect(() => {
    fetchProducts();
    fetchUsers();
  }, []);

  const fetchProducts = () => {
    fetch(`${BASE_URL}/api/admin/products`)
      .then((response) => response.json())
      .then((data) => setProducts(data))
      .catch((error) => console.error("Error fetching products:", error));
  };

  const fetchUsers = () => {
    fetch(`${BASE_URL}/api/admin/users`)
      .then((response) => response.json())
      .then((data) => setUsers(data))
      .catch((error) => console.error("Error fetching users:", error));
  };

  const addProduct = (product) => {
    fetch("/api/admin/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    })
      .then((response) => response.json())
      .then((newProduct) =>
        setProducts((oldProducts) => [...oldProducts, newProduct])
      )
      .catch((error) => console.error("Error adding product:", error));
  };

  const editProduct = (product) => {
    fetch(`${BASE_URL}/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(product),
    })
      .then((response) => response.json())
      .then((updatedProduct) =>
        setProducts((oldProducts) =>
          oldProducts.map((p) =>
            p.id === updatedProduct.id ? updatedProduct : p
          )
        )
      )
      .catch((error) => console.error("Error editing product:", error));
  };

  const deleteProduct = (productId) => {
    fetch(`${BASE_URL}/api/admin/products/${productId}`, { method: "DELETE" })
      .then((response) => response.json())
      .then(() =>
        setProducts((oldProducts) =>
          oldProducts.filter((p) => p.id !== productId)
        )
      )
      .catch((error) => console.error("Error deleting product:", error));
  };

  return (
    <div>
      <ProductList
        products={products}
        editProduct={editProduct}
        deleteProduct={deleteProduct}
      />
      <AddProduct addProduct={addProduct} />
      <UserList users={users} />
    </div>
  );
};

const ProductList = ({ products, editProduct, deleteProduct }) => (
  <div>
    {products.map((product) => (
      <div key={product.id}>
        <h3>{product.name}</h3>
        <p>{product.description}</p>
        <button onClick={() => editProduct(product)}>Edit</button>
        <button onClick={() => deleteProduct(product.id)}>Delete</button>
      </div>
    ))}
  </div>
);

export const AddProduct = ({ addProduct }) => {
  const [name, setName] = useState("");
  const [price, setPrice] = useState("");

  const handleSubmit = (event) => {
    event.preventDefault();
    addProduct({ name, price });
    setName("");
    setPrice("");
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name:
        <input
          type="text"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      </label>
      <label>
        Price:
        <input
          type="number"
          value={price}
          onChange={(e) => setPrice(e.target.value)}
          required
        />
      </label>
      <button type="submit">Add Product</button>
    </form>
  );
};

export const UserList = ({ users }) => (
  <div>
    {users.map((user) => (
      <div key={user.id}>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    ))}
  </div>
);

export default Admin;
