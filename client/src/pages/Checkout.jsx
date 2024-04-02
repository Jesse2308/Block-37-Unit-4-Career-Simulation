import React, { useState } from 'react';

const Checkout = () => {
  const [formData, setFormData] = useState({
    name: '',
    address: '',
    cardNumber: '',
    expiryDate: '',
    cvv: '',
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    // Process checkout data here
    console.log(formData);
  };

  return (
    <form onSubmit={handleSubmit}>
      <label>
        Name:
        <input type="text" name="name" onChange={handleChange} />
      </label>
      <label>
        Address:
        <input type="text" name="address" onChange={handleChange} />
      </label>
      <label>
        Card Number:
        <input type="text" name="cardNumber" onChange={handleChange} />
      </label>
      <label>
        Expiry Date:
        <input type="text" name="expiryDate" onChange={handleChange} />
      </label>
      <label>
        CVV:
        <input type="text" name="cvv" onChange={handleChange} />
      </label>
      <button type="submit">Submit</button>
    </form>
  );
};

export default Checkout;