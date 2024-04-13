import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

const Admin = () => {
  const [products, setProducts] = useState([]);
  const [users, setUsers] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    // Fetch products and users from the server
    // This is a placeholder, replace with your actual fetch logic
    fetchProducts().then(setProducts);
    fetchUsers().then(setUsers);
  }, []);

  const addProduct = (product) => {
    // Add product to the server
    // This is a placeholder, replace with your actual add logic
    addProductToServer(product).then((newProduct) =>
      setProducts((oldProducts) => [...oldProducts, newProduct])
    );
  };

  const editProduct = (product) => {
    // Edit product on the server
    // This is a placeholder, replace with your actual edit logic
    editProductOnServer(product).then((updatedProduct) =>
      setProducts((oldProducts) =>
        oldProducts.map((p) =>
          p.id === updatedProduct.id ? updatedProduct : p
        )
      )
    );
  };

  const deleteProduct = (productId) => {
    // Delete product from the server
    // This is a placeholder, replace with your actual delete logic
    deleteProductFromServer(productId).then(() =>
      setProducts((oldProducts) =>
        oldProducts.filter((p) => p.id !== productId)
      )
    );
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
        <button onClick={() => editProduct(product)}>Edit</button>
        <button onClick={() => deleteProduct(product.id)}>Delete</button>
      </div>
    ))}
  </div>
);

const AddProduct = ({ addProduct }) => {
  // Implement form handling logic here
  return <div>Add Product Form</div>;
};

const UserList = ({ users }) => (
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
