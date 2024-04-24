import { useState, useEffect } from "react";
import { loadStripe } from "@stripe/stripe-js";
import axios from "axios";
import "./Checkout.css";

// Load Stripe.js as soon as possible
const stripePromise = loadStripe(
  "pk_test_51P5GzSGGPEXzDHsTUrABOj0pPjuZGRh1yP190aZolbnq3dGnX9NDhfCIFRXDMn73rIw7x8MMZmrvyAyG2eU1F1q300w5eVUC2v"
);

// Checkout component for the checkout form
const Checkout = () => {
  const [card, setCard] = useState(null);

  useEffect(() => {
    const setupStripe = async () => {
      const stripe = await stripePromise;
      const elements = stripe.elements();

      // Create a card element
      const cardElement = elements.create("card", {
        style: {
          base: {
            color: "#32325d",
            fontFamily: '"Helvetica Neue", Helvetica, sans-serif',
            fontSmoothing: "antialiased",
            fontSize: "18px",
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

      // Mount the card element to the DOM
      cardElement.mount("#card-element");

      // Update the card state
      setCard(cardElement);
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
        "http://localhost:3000/api/create-checkout-session",
        {
          token: token.id,
        }
      );
      console.log("Session data:", session);

      // Redirect the user to the Stripe Checkout page
      const result = await stripe.redirectToCheckout({
        sessionId: session.id,
      });

      if (result.error) {
        console.error("Error redirecting to checkout:", result.error.message);
      }
    } catch (error) {
      console.error("Error in POST /create-checkout-session:", error);
    }
  };

  // Render the checkout form
  return (
    <div className="checkout">
      <form onSubmit={handleSubmit} className="checkout-form">
        <label className="checkout-label">
          Email
          <input type="email" className="checkout-input" required />
        </label>
        <label className="checkout-label">
          Card information
          <div id="card-element" className="checkout-card-element"></div>
        </label>
        <label className="checkout-label">
          Cardholder name
          <input type="text" className="checkout-input" required />
        </label>
        <label className="checkout-label">
          Country or region
          <input type="text" className="checkout-input" required />
        </label>
        <label className="checkout-label">
          ZIP
          <input type="text" className="checkout-input" required />
        </label>
        <button type="submit" className="checkout-button">
          Checkout
        </button>
      </form>
    </div>
  );
};

export default Checkout;
