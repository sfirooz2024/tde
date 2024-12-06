let passport = require("passport");
let LocalStrategy = require("passport-local").Strategy;
const { NotFoundError, UnauthorizedError } = require("./error");
const DB = require("./../models/db");
const CB = require("./../../business/common.business");


const prepareOAuthStrategies = (app, db) => {
  passport.serializeUser(function (user, cb) {
    cb(null, user);
  });

  passport.deserializeUser(function (obj, cb) {
    cb(null, obj);
  });

  const users = new DB.User(db);

  try {
    /**
     * Local login method
     */
    passport.use(new LocalStrategy({ usernameField: "username", passwordField: "password", passReqToCallback: true }, async (req, username, password, done) => {
      try {
        const email = req.body.email || "";
        const user = await users.findOneByEmailOrUsername(email, username);

        if (!user) {
          throw new NotFoundError("Username or password is wrong");
        }
        const verify = CB.AuthBusiness.validatePassword(
          password,
          user.hash,
          user.salt
        );
        if (!verify) {
          throw new UnauthorizedError("Username or password is wrong");
        }

        const result = await CB.AuthBusiness.generateAuthTokens(
          user._id,
          user.username,
          user.role,
          users
        );
        if (!result) {
          throw new UnauthorizedError("Username or password is wrong");
        }
        done(null, result);
      } catch (error) {
        done(error);
      }
    }));

  } catch (error) {
    console.log(error);
  }
};

module.exports = prepareOAuthStrategies;
