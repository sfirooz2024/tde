const Base = require("./Base");
const { Collection, Db, MongoClient } = require('mongodb');
class User extends Base {
    constructor(db, client) {
        /** @type {Db} */
        super(db, "Users")
        /** @type {Collection} */
        this.collection = db.collection('Users');
        /** @type {MongoClient} */
        this.client = client
    }
    
    async findOneByEmailOrUsername(email, username) {
        return this.collection.findOne({
            $or: [{ email: { $regex: email, $options: 'i' } }, { username: { $regex: username, $options: 'i' } }],
            deletedAt: { $exists: false }
        },
            {
                _id: 1,
                username: 1,
                name: 1,
                hash: 1,
                salt: 1,
                email: 1,
                role: 1
            });
    }

    async deleteUserAccount(user, reason) {
        const result = await this.collection.updateOne({
            _id: user._id
        }, {
            $set: {
                username: "__DELETED__" + user.username,
                email: "__DELETED__" + user.email,
                hash: null,
                salt: null,
                deleted: true,
                deletedAt: new Date(),
                deletedReason: reason
            }
        });
        return result.matchedCount > 0 || result.modifiedCount > 0;
    }
}


module.exports = User;