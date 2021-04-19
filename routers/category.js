const express = require("express");
const router = express.Router();
const db_connect = require("../util/db_connect")
const multer = require("multer")
const path = require("path")
const rootDir = require("../util/path")
const moment = require("moment")
const url = require("url")
const _ = require("lodash")
const {Storage} = require('@google-cloud/storage');
const cur_file_name = console.log(__filename.split("/").slice(-1)[0])
const customLogger = require("../util/logger");
const logger = customLogger("API")

var db = db_connect.database();
var plant_categories_rf = db.ref("plant_categories");


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



router.post('/add_new_category', upload.array("category_image", 1), (req, res, next) => {
    logger.info({"filename": cur_file_name, "message": `Add new category!!`, "endpoint": "/api/add_new_category", "type": "POST"})
    console.log(req.files)
    if(req.files){
        const all_files = req.files;
        const promises = []
        for (const idx in all_files){
            console.log(all_files[idx])
            promises.push(uploadImageAsPromise(all_files[idx]))
        }

        Promise.all(promises).then((publicURLS) => {
            const newPostKey = plant_categories_rf.push().key
            const postData = {
                "name": req.body.category_name || 'default_plant_name',
                "date": moment().format("D-MM-yyyy h:mm:ss")
            }
            for(const idx in publicURLS){
                postData[`image_link_${idx}`] = publicURLS[idx]
            }
            const data = {}
            data[newPostKey] = postData
            logger.info({"filename": cur_file_name, "message": `Data to be pushed`, "data": JSON.stringify(data), "endpoint": "/api/add_new_category", "type": "POST"})
            plant_categories_rf.update(data)
            logger.info({"filename": cur_file_name, "message": `${newPostKey}: ${postData.name} have been added successfully...`, "endpoint": "/api/add_new_item", "type": "POST"})
            return res.status(200).send("added succefully!!! Go to admin dashboard <a href='http://18.220.75.192:5000/admin/'>click here</a>")
            // return res.status(200).send({"message": "successfully added!!"})
        })
    } else{
        logger.error({"filename": cur_file_name, "status": 500, "message": `Bad request, no files attached`, "endpoint": "/api/add_new_item", "type": "POST"})
        return res.status(500).send("Bad Request, No files attached in the request")
    }
})

 router.get("/delete", (req, res) => {
    const urlObject = url.parse(req.url, true).query
    
    const {id} = urlObject;
    const id_list = id.split(",")
    logger.info({"filename": cur_file_name, "message": `Delete ${id_list}`, "endpoint": "/api/delete", "type": "get"})
    const promises = []
    for (const idx in id_list){
        promises.push(deleteCategoryAsPromise(id_list[idx]))
    }
    Promise.all(promises).then((messages) => {
        logger.info({"filename": cur_file_name, "message": `${id_list} have been deleted successfully`, "endpoint": "/api/delete", "type": "get"})
        return res.status(200).send({"message": "succesfully deleted"})
    }).catch((err) => {
        logger.error({"filename": cur_file_name, "status": 500, "message": `${err}`, "endpoint": "/api/delete", "type": "get"})
        return res.status(500).send({"message": "delete error"})
    })
})

router.get("/get", (req, res) => {
    const urlObject = url.parse(req.url, true).query

    const {id} = urlObject;
    logger.info({"filename": cur_file_name, "message": `Retrieve items from db:plant_categories`, "endpoint": "/api/category/get", "type": "get"})

    plant_categories_rf.on("value", function(snapshot){
        let data = []
        snapshot.forEach(function(child){
            let data_dict = {}
            // data_dict["key"] = child.key 
            let child_obj = child.val() 
            data_dict["category_name"] = child_obj["name"]
            data_dict["date"] = child_obj["date"]
            data_dict["id"] = child.key 
            for(var i=0; i<1; i++){
                if(child_obj[`image_link_${i}`]){
                    data_dict[`link_${i}`] = child_obj[`image_link_${i}`] 
                } else{
                    data_dict[`link_${i}`] = "https://firebasestorage.googleapis.com/v0/b/test-api-55d38.appspot.com/o/dummy.jpg?alt=media" 
                }
            }
            data.push(data_dict)
        })
        if(!_.isUndefined(id)){
            data = _.filter(data, {"id": id})
        }
        logger.info({"filename": cur_file_name, "message": `list of categories`, "data": JSON.stringify(data), "endpoint": "/api/categories", "type": "get"})
        return res.status(200).send(data)
    })
})


async function deleteCategoryAsPromise(id_val){
    logger.info({"filename": cur_file_name, "message": `executing`, "function": "deleteCategoryAsPromise", "data": JSON.stringify({"id": id_val}), "endpoint": "/api/delete", "type": "get"})
    return new Promise((resolve, reject) => {
        db.ref("plant_categories").child(id_val).remove().then(function() {
            logger.info({"filename": cur_file_name, "message": `executed`, "function": "deleteCategoryAsPromise", "data": JSON.stringify({'id': id_val, 'message': 'success'}), "endpoint": "/api/delete", "type": "get"})
            resolve({'id': id_val, 'message': 'success'})
          })
          .catch(function(error) {
            logger.error({"filename": cur_file_name, "message": error.message, "function": "deleteCategoryAsPromise", "data": JSON.stringify({'id': id_val, 'message': 'fail'}), "endpoint": "/api/delete", "type": "get"})
            reject({'id': id_val, 'message': 'fail'})
          });
    });
}


async function uploadImageAsPromise(imageFile){
    logger.info({"filename": cur_file_name, "message": `executing`, "function": "uploadImageAsPromise", "data": imageFile.originalname, "endpoint": "/api/category/add_new_item", "type": "POST"})
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
