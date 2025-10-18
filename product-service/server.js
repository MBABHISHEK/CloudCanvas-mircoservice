const express = require("express");
const app = express();

app.get("/products", (req, res) => {
  res.json([
    { id: 101, name: "Laptop" },
    { id: 102, name: "Phone" },
  ]);
});

app.listen(3002, () => console.log("Product Service running on port 3002"));
