const Base = require("./Base");

class Result extends Base {
    constructor(db) {
        super(db, "results");
        this.collection = db.collection('results');
    }


    async findUserResults(phone, hash, email) {

        const value = phone || hash || email;

        let query = {'profile.value' : value}

        return await this.collection.find(query).toArray();;
    }
}

module.exports = Result;
