const express = require("express");
const app = express();
const path = require("path");
const body_parser = require("body-parser");
const itemRoutes = require("./routers/item");
const customLogger = require("./util/logger");
const logger = customLogger("API")
const cur_file_name = console.log(__filename.split("/").slice(-1)[0])
// middle wares

function log_url(req, res, next) {
    var fullUrl = req.protocol + '://' + req.get('host') + req.url;
    logger.info({"message": "logging", "endpoint": fullUrl, "type": `${req.method}`})
    next()
}

app.use(log_url)

app.use(body_parser.urlencoded({"extended": false}));

app.use(express.static(path.join(__dirname, "public")))

app.use("/api", itemRoutes)


app.get("/", (req, res) => {
    res.status(404).send("Page not found error")
})

process.on('SIGINT', function() {
    logger.info({"filename": cur_file_name, "message": "closing the app..."})
    // console.log( "\nGracefully shutting down from SIGINT (Ctrl-C)" );
    // some other closing procedures go here
    process.exit(1);
});


app.listen(3000)
logger.info({"filename": cur_file_name, "message": "click (Ctrl-C) to shut down the app"})
