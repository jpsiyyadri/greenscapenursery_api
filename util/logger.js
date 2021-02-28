const { get } = require("lodash");
const { level, transports, transport } = require("winston");
const winston = require("winston"),
    CloudWatchTransport = require("winston-aws-cloudwatch")
const moment = require("moment")

// const myCustomLevels = {
//     "levels": {
//         "error": 0,
//         "warn": 2,
//         "info": 3,
//         "log": 4
//     },
//     "colors": {
//         "error": "#fc1c03",
//         "warn": "#fca103",
//         "info": "#03a1fc",
//         "log": "#18edd1"
//     }
// }

// winston.addColors(myCustomLevels.colors)

// logger configuration
const logConfig =  {
    // levels: myCustomLevels.levels,
    "transports": [
        new winston.transports.Console()
    ],
    "exceptionHandlers": [
        new winston.transports.File({
            filename: "winston_exception.log",
            level: 'info'
        })
    ]
}

const cloudWatchConfig = {
    logGroupName: process.env.CLOUDWATCH_GROUP_NAME,
    logStreamName: process.env.CLOUDWATCH_STREAM_NAME,
    createLogGroup: false,
    createLogStream: false,
    batchSize: 20,
    awsConfig: {
        accessKeyId: process.env.CLOUDWATCH_ACCESS_KEY_ID,
        secretAccessKey: process.env.CLOUDWATCH_SECRET_ACCESS_KEY,
        region: process.env.CLOUDWATCH_REGION
    }
}
    
function get_info(info){
    // const date_time = moment().utcOffset("+05:30").format("DD-MM-YYYY HH:mm:ss")
    const date_time = moment().utcOffset("+05:30").format("llll")
    const {level,label,filename, message, endpoint, type, data, status} = info;

    let log_string = `${date_time} | `
    if(level){
        log_string += `${level} | `
    }
    if(label){
        log_string += `${label} | `
    }
    if(filename){
        log_string += `@${filename} | `
    }
    if(type){
        log_string += `${type} | `
    }
    if(status){
        log_string += `Status: ${status} | `
    }
    if(endpoint){
        log_string += `${endpoint} | `
    }
    if(message){
        log_string += `${message}`
    }
    if(data){
        log_string += `${data}`
    }

    return log_string;
}

function customLogger(CATEGORY){
    logConfig["format"] = winston.format.combine(
        winston.format.colorize({
            all: true
        }),
        winston.format.prettyPrint(),
        winston.format.label({
            "label": CATEGORY
        }),
        winston.format.printf(get_info)
    )

    cloudWatchConfig["formatLog"] = winston.format.combine(
        winston.format.colorize({
            all: true
        }),
        winston.format.prettyPrint(),
        winston.format.printf(get_info)
    )
    
    
    // if production add  cloudWatchInstance to the transports
    if(process.env.NODE_ENV == 'production'){
        const cloudWatchInstance = new CloudWatchTransport(cloudWatchConfig)
        logConfig["transports"].push(cloudWatchInstance)
    }
    
    // create the logger
    // const logger = winston.createLogger(logConfig)
    const logger = new winston.createLogger(logConfig)
    return logger
}

module.exports = customLogger;
