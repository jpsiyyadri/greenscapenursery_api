const express = require("express");
const router = express.Router();
const db_connect = require("../util/db_connect")
const multer = require("multer")
const path = require("path")
const rootDir = require("../util/path")
const moment = require("moment")
const url = require("url")
const _ = require("lodash")


var db = db_connect.database();
var items_rf = db.ref("items");

const {Storage} = require('@google-cloud/storage');
const { isUndefined } = require("lodash");
const { copyFileSync } = require("fs");

// Creates a client
const storage = new Storage({
    projectId: process.env.projectId,
    keyFilename: process.env.key_file_name
});


const bucket = storage.bucket(process.env.storageBucket)
// console.log("bucket: ", bucket)
const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 5 * 1024 * 1024 // limits 5 MB
    }
})

const plant_obj = {}

router.post("/add", (req, res) => {
    plant_obj['plant_name'] = req.body.plant_name;
    plant_obj['plant_description'] = req.body.plant_description
    return res.status(200).sendFile(path.join(rootDir, "views", "item", "upload.html"))
})

router.get("/save", (req, res) => {
    var newPostKey = items_rf.push().key
    items_rf.child(newPostKey).update(plant_obj, (error) => {
        if(error){
            return res.status(500).send('failed to upload data')
        } else{
            return res.status(200).send(plant_obj)
        }
    })
})

router.get("/items", (req, res) => {
    const urlObject = url.parse(req.url, true).query

    const {id} = urlObject;

    return items_rf.once("value", function(snapshot){
        let data = []
        snapshot.forEach(function(child){
            let data_dict = {}
            data_dict["id"] = child.key
            let child_obj = child.val() 
            data_dict["plant_name"] = child_obj["name"]
            data_dict["plant_description"] = child_obj["description"]
            data_dict["plant_price"] = child_obj["price"] 
            data_dict["link_0"] = child_obj["image_link_0"] 
            data_dict["link_1"] = child_obj["image_link_1"] 
            data_dict["link_2"] = child_obj["image_link_2"] 
            data.push(data_dict)
        })

        if(!_.isUndefined(id)){
            data = _.filter(data, {"id": id})
        }
        console.log("items have been extracted and sending")
        return res.send(_.filter(data))
    })
})

router.post('/add_new_item', upload.array("plant_image", 3), (req, res, next) => {
    console.log()
    if(req.files){
        const all_files = req.files;
        const promises = []
        for (const idx in all_files){
            promises.push(uploadImageAsPromise(all_files[idx]))
        }

        Promise.all(promises).then((publicURLS) => {
            const newPostKey = items_rf.push().key
            const postData = {
                "name": req.body.plant_name || 'default_plant_name',
                "description": req.body.plant_description || 'default_description',
                "category": req.body.plant_category || 'default_category',
                "price": req.body.plant_price || 'default_price',
                "date": moment().format("D-MM-yyyy h:mm:ss")
            }
            for(const idx in publicURLS){
                postData[`image_link_${idx}`] = publicURLS[idx]
            }
            const data = {}
            data[newPostKey] = postData

            items_rf.update(data)
            console.log("items have been uploaded succesfully!!")
            return res.status(200).send("added succefully!!! Go to admin dashboard <a href='http://18.220.75.192:5000/admin/'>click here</a>")
            // return res.status(200).send({"message": "successfully added!!"})
        })
    } else{
        return res.status(500).send("Bad Request, No files attached in the request")
    }
})

 router.get("/delete", (req, res) => {
    const urlObject = url.parse(req.url, true).query

    const {id} = urlObject;
    const id_list = id.split(",")
    console.log(id_list)
    const promises = []
    for (const idx in id_list){
        promises.push(deleteItemAsPromise(id_list[idx]))
    }
    Promise.all(promises).then((messages) => {
        console.log("items have been deleted!!")
        return res.status(200).send(`Successfully deleted!! Go to admin dashboard <a href='http://18.220.75.192:5000/admin/'>click here</a>`)
    }).catch((err) => {
        console.log("items have not been deleted!!")
        return res.status(500).send({"message": "delete error"})
    })
})


router.get("/categories", (req, res) => {
    const urlObject = url.parse(req.url, true).query

    const {id} = urlObject;

    db.ref("plant_types").on("value", function(snapshot){
        let data = []
        snapshot.forEach(function(child){
            let data_dict = {}
            data_dict["key"] = child.key 
            data_dict["val"] = child.val() 
            data.push(data_dict)
        })
        if(!isUndefined(id)){
            data = _.filter(data, {"key": id})
        }
        return res.status(200).send(data)
    })
})

async function deleteItemAsPromise(id_val){
    return new Promise((resolve, reject) => {
        items_rf.child(id_val).remove().then(function() {
            console.log("Remove succeeded.")
            resolve({'id': id_val, 'message': 'success'})
          })
          .catch(function(error) {
            console.log("Remove failed: " + error.message)
            reject({'id': id_val, 'message': 'fail'})
          });
    });
}


async function uploadImageAsPromise(imageFile){
    return new Promise((resolve, reject) => {
            // create a new blob
            const blob = bucket.file(`plant_${moment().format("DMMyyyyhmmss")}_${imageFile.originalname}`);
            // create a writable stream
            const blobWriter = blob.createWriteStream({
                metadata: {
                    contentType: imageFile.mimetype
                }
            });

            blobWriter.on("error", reject)

            blobWriter.on("finish", () => {
                // assembling public url for accessing the file via http
                const publicURL = `https://firebasestorage.googleapis.com/v0/b/${bucket.name}/o/${encodeURI(blob.name)}?alt=media`
                resolve(publicURL)
            })

            blobWriter.end(imageFile.buffer)
    });
}

module.exports = router;
