const redis = require("redis");
const config = require('./../common/config/config');
const logger = require('./../common/logging/logger');
const moment = require("moment");

class Cache {
    constructor() {
    }

    async init() {
        this.client = redis.createClient({
            url: config.Redis.url
        });

        this.client.on('error', (err) => logger.info('Redis Client Error', err));
        this.client.on('connect', function() {
            logger.info("Redis Client Connected!");
        });

        await this.client.connect();
    }

    getElasticCacheKey (key) {
        return (key?.indexOf(config.Redis.NAMESPACE) === -1) ? `${config.Redis.NAMESPACE}${key}` : key;
    }

    async clearCache() {
        let keys = await this.client.keys(`${process.env.NAMESPACE}*`);

        // Delete each key
        if (keys?.length) {
            keys.forEach((key) => {
                this.client.del(key);
            })
        }
    }

    async getValue(key) {

        if (!key) return;

        key = this.getElasticCacheKey(key);

        const result = await this.client.get(key);
        return JSON.parse(result);
    }

    async setValue(key, value, _timeout = 90000) {

        if (!key || !value) return;

        key = this.getElasticCacheKey(key);
        this.client.del(key);

        Date.prototype.toJSON = function(){
            return moment(this).format("YYYY-MM-DDTHH:mm:ss");;
        };

        this.client.set(key, JSON.stringify(value));

        this.client.expire(key, _timeout);

    }

    async delValue(key) {
        if (!key) return;

        key = this.getElasticCacheKey(key);

        return this.client.del(key);
    }

    async deleteBasedOnPrefix(key) {
        if (!key) return null;

        let prefix = this.getElasticCacheKey(key);

        let keys = await this.client.keys(`${prefix}*`);

        if (!keys || keys.length === 0) return;

        keys.forEach((key) => {
            this.client.del(key);
        })

        return;
    }
}

const cache = new Cache();

module.exports = cache;
