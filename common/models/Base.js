const uuid = require("uuid");
const lodash = require("lodash");
const { Collection, Db } = require('mongodb');
const moment = require('moment-timezone');

class Base {

    constructor(db, collectionName) {
        /** @type {Db} */
        this.db = db;
        /** @type {Collection} */
        this.collection = db.collection(collectionName);

        this.transactionOptions = {
            readPreference: 'primary',
            readConcern: { level: 'local' },
            writeConcern: { w: 'majority' }
        }

        this.utils = {
            //sanitize username for search regex with  numeric and characters
            sanitizeUsername: (username) => {
                username = username.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
                username = username + "$";
                return username;
            }
        };
    }

    async getByID(_id) {
        const query = { 
            _id: _id,
            deletedAt: { $eq: null }
         };
        return this.collection.findOne(query);
    }

    async checkByName(name) {
        const query = { name: name };
        return this.collection.findOne(query);
    }

    async softDeleteByID(_id) {
        const filter = { _id: _id };
        const update = {
            $set: {
                deletedAt: moment().tz("America/New_York").format('YYYY-MM-DD hh:mm:ss')
            }
        }
        const result = await this.collection.updateOne(filter, update);
        return (result.modifiedCount == 1 || result.matchedCount == 1);
    }

    async deleteByID(_id) {
        const filter = { _id: _id };
        const result = await this.collection.deleteOne(filter);
        return result.deletedCount == 1;
    }

    async deleteByIDList(_ids) {
        const filter = { _id: { $in: (_ids || []) } };
        const result = await this.collection.deleteMany(filter);
        return result.deletedCount == _ids.length;
    }

    async findAndDeleteOne(filter) {
        const result = await this.collection.deleteOne(filter);
        return result.deletedCount == 1;
    }

    async softDeleteByIDList(_ids) {
        const filter = { _id: { $in: _ids } };
        const update = {
            $set: {
                deletedAt: moment().tz("America/New_York").format('YYYY-MM-DD hh:mm:ss')
            }
        }
        const result = await this.collection.updateMany(filter, update);
        return (result.modifiedCount == _ids.length || result.matchedCount == _ids.length);
    }

    async save(item) {
        item._id = uuid.v4();
        item.createdAt = new Date();
        const result = await this.collection.insertOne(item);
        return result.acknowledged ? item : null;
    }

    async saveMany(items) {
        for (let i = 0; i < items.length; i++) {
            items[i]._id = uuid.v4();
            items[i].createdAt = moment().tz("America/New_York").format('YYYY-MM-DD hh:mm:ss');
        }
        const result = await this.collection.insertMany(items);
        return result.insertedCount == items.length;
    }

    async saveManyWithoutID(items) {
        const result = await this.collection.insertMany(items);
        return result.insertedCount == items.length;
    }

    async update(_id, item) {
        item.modifiedAt = moment().tz("America/New_York").format('YYYY-MM-DD hh:mm:ss');
        const update = {
            $set: item
        }
        const filter = { _id: _id };
        const options = { returnDocument: 'after' };
        const result = await this.collection.findOneAndUpdate(filter, update, options);
        return (result.value && result.ok == 1) ? result.value : null;
    }
    async updateWithFilter(filter, item) {
        item.modifiedAt = moment().tz("America/New_York").format('YYYY-MM-DD hh:mm:ss');
        const update = {
            $set: item
        }        
        const result = await this.collection.updateOne(filter, update);
        return (result.modifiedCount == 1 || result.matchedCount == 1) ? true : null;
    }

    async updateNull(filter, item) {        
        const update = {
            $unset: item,
            $set:{
                modifiedAt: moment().tz("America/New_York").format('YYYY-MM-DD hh:mm:ss')
            }
        }        
        const result = await this.collection.updateOne(filter, update);
        return result.modifiedCount == 1 || result.matchedCount == 1 
    }

    async upsert(filter, item) {
        const _id = item._id || uuid.v4();
        if (!item._id) {
            item._id = _id;
        }
        item.modifiedAt = moment().tz("America/New_York").format('YYYY-MM-DD hh:mm:ss');
        const update = {
            $set: item
        }
        const result = await this.collection.updateOne(filter, update, {
            upsert: true
        });
        return (result.modifiedCount == 1 || result.matchedCount == 1 || result.upsertedCount == 1) ? _id : null;
    }

    async list(limit, offset, sortField) {
        const filter = {
            deletedAt: { $eq: null }
        }
        let options = {};
        if (sortField) {
            options.sort = sortField;
        }
        const result = await this.collection.find(filter, options).skip(offset).limit(limit);
        return result.toArray();
    }

    async filterList(filter, limit, offset, sortField) {
        let options = {};
        if (sortField) {
            options.sort = sortField;
        }
        const result = await this.collection.find(filter, options).skip(offset).limit(limit);
        return result.toArray();
    }

    async listByIDs(ids, sortField, limit = 20, offset = 0) {
        var filter = {
            deletedAt: { $exists: false }
        }

        if (ids && ids.length && ids.length > 0) {
            filter._id = { $in: ids }
        }
        let options = {};
        if (sortField) {
            options.sort = sortField;
        }
        const result = await this.collection.find(filter, options).skip(offset).limit(limit);
        return result.toArray();
    }

    async search(filter, options) {

        const result = await this.collection.find(filter, options);
        return result.toArray();
    }

    async count(filter, options) {
        return await this.collection.countDocuments(filter, options);
    }

    mergeByIds(extraItems, targetItems) {
        for (let i = 0; i < targetItems.length; i++) {
            targetItems[i] = lodash.merge(extraItems.find(x => x._id == targetItems[i]._id), targetItems[i]);
        }
        return targetItems;
    }
}
module.exports = Base;
