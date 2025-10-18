const express = require("express");
const app = express();

app.get("/users", (req, res) => {
  res.json([
    { id: 1, name: "Abhishek" },
    { id: 2, name: "kiran" },
  ]);
});

app.listen(3001, () => console.log("User Service running on port 3001"));
