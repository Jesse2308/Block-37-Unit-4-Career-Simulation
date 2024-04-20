import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
const BASE_URL = "http://localhost:3000";

// This is the main Admin component
const Admin = () => {
  // State variables for products and users
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);

  // This effect runs once when the component mounts
  useEffect(() => {
    // Fetch products from the server
    fetchProducts();

    // Fetch users from the server
    fetchUsers();
  }, []);

  // Fetch products from the server
  const fetchProducts = () => {
    fetch(`${BASE_URL}/api/admin/products`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Products fetched:", data); // Log the fetched products
        setProducts(data);
      })
      .catch((error) => console.error("Error fetching products:", error));
  };

  // Fetch users from the server
  const fetchUsers = () => {
    fetch(`${BASE_URL}/api/admin/users`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Users fetched:", data); // Log the fetched users
        setUsers(data);
      })
      .catch((error) => console.error("Error fetching users:", error));
  };

  const addProduct = (product) => {
    console.log("Adding product:", product); // Log the product to be added
    // Add product to the server
    fetch("/api/admin/products", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((newProduct) => {
        console.log("Product added:", newProduct); // Log the added product
        setProducts((oldProducts) => [...oldProducts, newProduct]);
      })
      .catch((error) => console.error("Error adding product:", error));
  };

  const editProduct = (product) => {
    console.log("Editing product:", product); // Log the product to be edited
    // Edit product on the server
    fetch(`${BASE_URL}/api/admin/products/${product.id}`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(product),
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((updatedProduct) => {
        console.log("Product updated:", updatedProduct); // Log the updated product
        setProducts((oldProducts) =>
          oldProducts.map((p) =>
            p.id === updatedProduct.id ? updatedProduct : p
          )
        );
      })
      .catch((error) => console.error("Error editing product:", error));
  };

  const deleteProduct = (productId) => {
    console.log("Deleting product:", productId); // Log the id of the product to be deleted
    // Delete product from the server
    fetch(`${BASE_URL}/api/admin/products/${productId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(() => {
        console.log("Product deleted:", productId); // Log the id of the deleted product
        setProducts((oldProducts) =>
          oldProducts.filter((p) => p.id !== productId)
        );
      })
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
        <p>{product.description}</p> {/* Added product description */}
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
        {/* Display other user information here */}
      </div>
    ))}
  </div>
);

export default Admin;
