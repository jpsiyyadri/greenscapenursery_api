const express = require("express");
const firebase_admin = require("firebase-admin");
var db = firebase_admin.database();
var users_rf = db.ref("users")
const router = express.Router();
const cur_file_name = console.log(__filename.split("/").slice(-1)[0])


router.post("/add", (req, res) => {

})

router.delete("/delete", (req, res) => {

})

router.put("/update", (req, res) => {

})

router.get("/show", (req, res) => {

})

module.exports = router;
