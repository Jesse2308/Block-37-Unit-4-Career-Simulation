import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

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
    fetch("/api/admin/products")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Products fetched:", data);
        setProducts(data);
      })
      .catch((error) => console.error("Error fetching products:", error));
  };

  // Fetch users from the server
  const fetchUsers = () => {
    fetch("/api/admin/users")
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then((data) => {
        console.log("Users fetched:", data);
        setUsers(data);
      })
      .catch((error) => console.error("Error fetching users:", error));
  };

  const addProduct = (product) => {
    console.log("Adding product:", product);
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
        console.log("Product added:", newProduct);
        setProducts((oldProducts) => [...oldProducts, newProduct]);
      })
      .catch((error) => console.error("Error adding product:", error));
  };

  const editProduct = (product) => {
    console.log("Editing product:", product);
    // Edit product on the server
    fetch(`/api/admin/products/${product.id}`, {
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
        console.log("Product updated:", updatedProduct);
        setProducts((oldProducts) =>
          oldProducts.map((p) =>
            p.id === updatedProduct.id ? updatedProduct : p
          )
        );
      })
      .catch((error) => console.error("Error editing product:", error));
  };

  const deleteProduct = (productId) => {
    console.log("Deleting product:", productId);
    // Delete product from the server
    fetch(`/api/admin/products/${productId}`, {
      method: "DELETE",
    })
      .then((response) => {
        if (!response.ok) {
          throw new Error("Network response was not ok");
        }
        return response.json();
      })
      .then(() => {
        console.log("Product deleted:", productId);
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
