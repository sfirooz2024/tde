if (process.env.NODE_ENV == "dev") {
    module.exports = require('./config_dev.json')
}
else if (process.env.NODE_ENV == "local") {
    module.exports = require('./config_test.json')
}
else if (process.env.NODE_ENV == "prod") {
    module.exports = require('./config_prod.json')
}
