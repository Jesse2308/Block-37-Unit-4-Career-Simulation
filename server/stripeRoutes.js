const express = require("express");
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

const router = express.Router();

router.post("/create-checkout-session", async (req, res) => {
  try {
    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [
        {
          price_data: {
            currency: "usd",
            product_data: {
              name: "Your Product Name",
            },
            unit_amount: 1000, // amount in cents
          },
          quantity: 1,
        },
      ],
      mode: "payment",
      success_url: "https://example.com/success",
      cancel_url: "https://example.com/cancel",
    });

    res.json({ id: session.id });
  } catch (error) {
    console.error("Error in /create-checkout-session:", error);
    res
      .status(500)
      .json({ error: "An error occurred while creating the checkout session" });
  }
});

module.exports = router;
