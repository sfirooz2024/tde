const config = require('./../common/config/config');
const logger = require('./../common/logging/logger');

const init = (app, version) => {

    // USER APIS    
    logger.info(`Setting User API routes`);

    let basePath = config.API.basePath +  (version || "");
    {
        // Impression APIs
        {            
            let impressionEditorRouter = require('../api/user/impression');
            app.use(basePath + '/tde', impressionEditorRouter);
        }
        {            
            let surveyEditorRouter = require('../api/user/survey');
            app.use(basePath + '/tde', surveyEditorRouter);
        }
        {            
            let resultEditorRouter = require('../api/user/result');
            app.use(basePath + '/tde', resultEditorRouter);
        }
    }
}

module.exports.init = init;
