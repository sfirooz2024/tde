const { MongoClient } = require('mongodb');
const logger = require('./../logging/logger');
const config = require('./../config/config');
const AuthBusiness = require('../../business/cb.auth');

let adminUser = {
    _id: "8555802a-185a-4bfb-97da-8e83cdc2fdbd",
    username: "AFAdmin",
    hash: "",
    salt: "",
    admin:true,
    email: "admin@gmail.com"
}

class MongoDB {
    constructor() {
        this.client = new MongoClient(config.Database.URI, config.Database.options);
        process.on('SIGINT', () => this.cleanup);
        process.on('SIGTERM', () => this.cleanup);
        process.on('exit', () => this.cleanup)
    }

    cleanup() {
        logger.info("Closing DB connection");
        this.client.close();
    }

    async init() {
        try {
            await this.client.connect();
            this.db = this.client.db(config.Database.DBName);            
            await this.db.command({ ping: 1 });
            logger.info("successfully connected to DB");

            await this.checkCollections(config.Database.Collections);

            // try {
            //     await this.ensureAdmin();
            //     await this.ensureIndexList();
            // } catch (error) {
            //     logger.error(error);
            // }

        } catch (error) {
            logger.error(error);
        }
    }

    async checkCollections(collectionList) {
        logger.info("Checking Collections");
        var currentCollections = await this.db.collections();
        collectionList.forEach(async x => {
            if (currentCollections.findIndex(collection => collection.collectionName == x) < 0) {
                //TODO add missing collection                
                logger.warn(`Collection not found ${x} at db `);
                try {
                    await this.db.createCollection(x);
                } catch (error) {
                    logger.error(`Error creating collection ${x}:  ` + error);
                }

                logger.info(`Collection created ${x} at db `);
            }
            else {
                logger.info(`Collection ${x} found at db `);
            }
        });
        logger.info("Checking Collections finished");
    }

    async ensureAdmin() {
        const users = this.db.collection("Users");
        {
            const adminAccount = await users.findOne({ _id: adminUser._id });
            if (!adminAccount) {
                const { hash, salt } = AuthBusiness.generateHashAndSalt("(KRyZZ6v&ce)#2?7");
                adminUser.hash = hash;
                adminUser.salt = salt;
                await users.insertOne(adminUser);
            }
        }
    }

    async ensureIndexList() {
        await this.db.collection("Users").createIndex({
            email: 1
        }, {
            unique: true
        });
    }
}

module.exports = new MongoDB();
