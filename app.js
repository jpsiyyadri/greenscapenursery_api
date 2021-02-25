const express = require("express");
const app = express();
const path = require("path")
const body_parser = require("body-parser");
const itemRoutes = require("./routers/item")


// middle wares
app.use(body_parser.urlencoded({"extended": false}));

app.use(express.static(path.join(__dirname, "public")))

app.use("/api", itemRoutes)


app.get("/", (req, res) => {
    res.status(404).send("Page not found error")
})


app.listen(3000)
console.log("port 3000 is runing..")
