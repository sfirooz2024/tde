const express = require('express');
const router = express.Router();
const { GeneralError, asyncHandler} = require('../../../common/helpers/error');
const { ValidatorMiddleware, CreateImpressionValidator, DateSearchValidator, FindImpressionValidator, PaginateValidator} = require('../../validator');
const DB = require('../../../common/models/db');

// Creates a new ad
router.post('/impression/create', CreateImpressionValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {

    const { surveyId, pageId, action, userHash, ip, userAgent, surveyAnswers, queryParams, appId } = req.body;

    const impressions = new DB.Impression(req.app.locals.db);

    const newImpression = await impressions.save({
        surveyId: surveyId,
        pageId: pageId,
        action, action,
        userHash: userHash,
        ip: ip,
        userAgent: userAgent,
        additional: {
            surveyAnswers: surveyAnswers,
            queryParams: queryParams
        },
        appId: appId,
    });

    if (!newImpression) {
        throw new GeneralError("Unable to create impression");
    }

    return res.json(newImpression._id);
}));

// List all answers by survey
router.get('/impression/list/answers', FindImpressionValidator, DateSearchValidator, PaginateValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    // Check if ads list is cached
    const { startDate, endDate, limit, offset, appId, surveyId, source, column, order } = req.query;

    const impressions = new DB.Impression(req.app.locals.db);
    let result = await impressions.findAnswerCountInRange(startDate, endDate, appId, surveyId, source, limit, offset, column, order);

    const detailedReport = result && result[0] && result[0].detailed ? result[0].detailed : null;
    const totalReport = result && result[0] && result[0].total ? result[0].total : null;
    const count = result && result[0] && result[0].count && result[0].count[0]?.count ? result[0].count[0]?.count : null;
    return res.json({result : {totalReport, detailedReport, count}});
}));

// List all actions by survey
router.get('/impression/list/actions', FindImpressionValidator, DateSearchValidator, PaginateValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    // Check if ads list is cached
    let { startDate, endDate, limit, offset, appId, surveyId, source, column, order } = req.query;

    const impressions = new DB.Impression(req.app.locals.db);
    let result = await impressions.findActionCountInRange(startDate, endDate, appId, surveyId, source, limit, offset, column, order);

    const detailedReport = result && result[0] && result[0].detailed ? result[0].detailed : null;
    const totalReport = result && result[0] && result[0].total ? result[0].total : null;
    const count = result && result[0] && result[0].count && result[0].count[0]?.count ? result[0].count[0]?.count : null;
    return res.json({result : {totalReport, detailedReport, count}});
}));

module.exports = router;