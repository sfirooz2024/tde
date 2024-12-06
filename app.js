process.on('uncaughtException', function (err) {
    console.error(err.stack);
    console.log("Node NOT Exiting...");
});

const mongo = require('./common/db/mongo');
const config = require('./common/config/config');
const errorHandler = require('./common/helpers/errorHandler');
const app = require('./common/server/server');
const logger = require('./common/logging/logger');

const { PrepareDocs } = require('./app/app.docs');

const cache = (config?.Redis?.enabled) ? require('./business/cb.cache') : null;

const init = (processID) => {
    logger.info("Starting app");
    logger.info("Configuration");
    logger.info(JSON.stringify(config));

    // Prepare docs
    PrepareDocs(app);

    // Setup routes
    require('./app/app.user').init(app);

    // Setup error handler
    app.use((err, req, res, next) => {
        errorHandler(err, req, res, next);
    });

    // Start DB
    mongo.init()
        .then(async () => {
            logger.info("DB connection successful");
            app.locals.db = mongo.db;
            app.locals.client = mongo.client;

            if (cache) {
                cache.init();
                app.locals.cache = cache;
            }

            app.listen(config.API.port, () => {
                app.emit('AppStarted');
            });

            logger.info(`API is listening on port ${config.API.port}`);
        })
        .catch((error) => {
            logger.error(error);
            logger.error("Could not connect to DB");
            process.exit(1);
        });
}
require('./common/helpers/clusterHelper')(config.API.clusterCount, init);

module.exports = app;
