var crypto = require('crypto');
const config = require('./../common/config/config');
const logger = require('./../common/logging/logger');
const jwt = require("jsonwebtoken");
const UUID = require("uuid");

class AuthBusiness {
    constructor() {

    }

    static async generateAuthTokens(userID, username, role, users) {
        try {
            const accessToken = jwt.sign(
                {
                    userID: userID,
                    username: username,
                    role: role
                },
                config.JWT.Web.accessTokenSecret, 
                { 
                    expiresIn: config.JWT.Web.accessTokenExpiresIn 
                });

            const refreshTokenUUID = UUID.v4();

            const refreshToken = jwt.sign({ token: refreshTokenUUID }, config.JWT.Web.refreshTokenSecret, { expiresIn: config.JWT.Web.refreshTokenExpiresIn });

            let result = await users.update(userID, { refreshToken: refreshTokenUUID, lastLoginDate: Date.now() });

            if (result) {
                return {
                    _id: userID,
                    username: username,
                    accessToken: accessToken,
                    refreshToken: refreshToken
                }
            }
        } catch (error) {
            logger.error(error);
        }
        return null;
    }

    static async refreshUser(user, token, users) {
        //Verify by  refresh token
        const decoded = await jwt.verify(token, config.JWT.Web.refreshTokenSecret);
        if (!decoded) {
            throw new UnauthorizedError("JWT malformed");
        }
        return this.generateAuthTokens(user._id, user.username, user.role, users);
    }

    static generateHashAndSalt(password) {
        let salt = crypto.randomBytes(16).toString('hex');
        let hash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
        return { salt, hash };
    }

    static validatePassword(password, hash, salt) {
        var generatedHash = crypto.pbkdf2Sync(password, salt, 1000, 64, `sha512`).toString(`hex`);
        return generatedHash === hash;
    }

}


module.exports = AuthBusiness;