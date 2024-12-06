const { GeneralError } = require('./error');

const logger = require('./../logging/logger');
const { MongoError } = require('mongodb');

const errorHandler = (err, req, res) => {

    if (err instanceof GeneralError) {
        logger.error("HTTP error status code|" + err.statusCode + "|message|" + err.message);
        return res.status(err.statusCode).json({
            message: err.message
        });
    }
    else if (err instanceof MongoError){
        logger.error(err);
        if(err.code == 11000){
            return res.status(409).json({
                message: "Duplicate key value, please change" + JSON.stringify(err.keyValue)
            })
        }        
        return res.status(500).json({
            message: "Internal DB error " + err.errmsg,
            code: err.code            
        })
    }
    logger.error("HTTP error status code|500|message|" + err.message);
    // default to 500 server error
    return res.status(500).json({ message: err.message });
}

module.exports = errorHandler;
