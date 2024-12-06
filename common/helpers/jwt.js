const config = require('./../config/config');
const jwt = require('jsonwebtoken');
const { GeneralError } = require('./error');
const DB = require('./../models/db');

const verifyToken = (token) => {
    const {
        userID,
        username,
        role
    } = jwt.verify(token, config.JWT.Web.accessTokenSecret);
    return {
        userID,
        username,
        role
    }
}

const authenticateSocial = async (req) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];
        return  jwt.verify(token, config.JWT.Web.accessTokenSecret);
    }
    throw new GeneralError("Invalid token");
}

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, config.JWT.Web.accessTokenSecret, (err, user) => {
            if (err) {
                if (err.name == 'TokenExpiredError')
                    res.status(401);
                else {
                    res.status(403);
                }
                return res.send(err.message);
            }
            req.user = user || {};
            if(req.user.role == DB.Enums.UserRoles.Admin){
                req.user.admin = true;
            }
            next();
        });
    } else {
        res.sendStatus(401);
    }
};

const authenticateAPI = (req, res, next) => {
    if(config.App.env == "dev"){
        return next();
    }
    const apiKeyHeader = req.headers["apikey"];
    if (apiKeyHeader && apiKeyHeader == config.App.ApiKey) {
        return next();
    } else {
        res.sendStatus(401);
    }
};

module.exports = {
    authenticateSocial,
    authenticateJWT,
    authenticateAPI,
    verifyToken
};