const express = require("express");
const router = express.Router();
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

router.post("/create-checkout-session", async (req, res) => {
  try {
    // Assume req.body.products is an array of product IDs the user wants to purchase
    const productIds = req.body.products;

    // Fetch the corresponding products from your database
    const products = await getProductsFromDatabase(productIds); // Replace with your actual function to fetch products

    // Create the line_items array
    const line_items = products.map((product) => ({
      price_data: {
        currency: "usd",
        product_data: {
          name: product.name, // Use the actual product name
        },
        unit_amount: product.price, // Use the actual product price
      },
      quantity: 1, // Adjust as needed
    }));

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items,
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
