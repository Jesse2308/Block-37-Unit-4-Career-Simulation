import React, { useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import "./Checkout.css";

// Load Stripe.js as soon as possible
const stripePromise = loadStripe(
  "pk_test_51P5GzSGGPEXzDHsTUrABOj0pPjuZGRh1yP190aZolbnq3dGnX9NDhfCIFRXDMn73rIw7x8MMZmrvyAyG2eU1F1q300w5eVUC2v"
);

const Checkout = () => {
  let card;

  useEffect(() => {
    const setupStripe = async () => {
      const stripe = await stripePromise;
      const elements = stripe.elements();
      const card = elements.create("card", {
        style: {
          base: {
            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "18px", // Increase the font size
            "::placeholder": {
              color: "#aab7c4",
            },
          },
          invalid: {
            color: "#fa755a",
            iconColor: "#fa755a",
          },
        },
      });
      card.mount("#card-element");
    };

    setupStripe();
  }, []);

  const handleSubmit = async (event) => {
    event.preventDefault();

    const stripe = await stripePromise;

    // Create a token with the card details
    const { token, error } = await stripe.createToken(card);

    if (error) {
      console.error("Error creating token:", error);
      return;
    }

    try {
      // Send the token to your server
      const { data: session } = await axios.post(
        "http://localhost:5173/create-checkout-session",
        {
          token: token.id,
        }
      );
      // Handle the session data...
    } catch (error) {
      console.error("Error in POST /create-checkout-session:", error);
      // Handle the error...
    }
  };

  return (
    <form onSubmit={handleSubmit} className="checkout-form">
      <label>
        Email
        <input type="email" className="checkout-input" required />
      </label>
      <label>
        Card information
        <div id="card-element"></div>
      </label>
      <label>
        Cardholder name
        <input type="text" className="checkout-input" required />
      </label>
      <label>
        Country or region
        <input type="text" className="checkout-input" required />
      </label>
      <label>
        ZIP
        <input type="text" className="checkout-input" required />
      </label>
      <button type="submit" className="checkout-button">
        Checkout
      </button>
    </form>
  );
};

export default Checkout;
