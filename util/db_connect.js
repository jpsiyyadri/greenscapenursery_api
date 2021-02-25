const firebase_admin = require("firebase-admin");
const path = require("path")
const rootDir = require("./path")
require("dotenv/config")


firebase_admin.initializeApp({
    credential: firebase_admin.credential.cert(path.join(rootDir, process.env.key_file_name)),
    databaseURL: process.env.databaseURL
})


// firebase_admin.initializeApp(config)

module.exports = firebase_admin;