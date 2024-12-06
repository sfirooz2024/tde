const logger = require('./../common/logging/logger');
const config = require('./../common/config/config');

const swaggerUI = require('swagger-ui-express');
const yamlJS = require('yamljs');
const swaggerBaseDocument = yamlJS.load(require('path').join(__dirname, './../docs/base/api_docs.yaml'));

const PrepareDocs = (app, version) => {
    logger.info(`Setting API docs`);
    let basePath = config.API.basePath;

    // Setup api docs
    app.use(basePath + '/api-docs', swaggerUI.serve, (...args) => swaggerUI.setup(swaggerBaseDocument)(...args));
}

module.exports.PrepareDocs = PrepareDocs;