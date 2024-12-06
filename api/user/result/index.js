const express = require('express');
const router = express.Router();
const { GeneralError, asyncHandler} = require('../../../common/helpers/error');
const { ValidatorMiddleware, CreateResultValidator, FindResultValidator, GetResultCountValidator} = require('../../validator');
const DB = require('../../../common/models/db');
const moment = require('moment-timezone');

router.post('/result', CreateResultValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { userHash, answers, appId, profile, surveyId, dupeWindow } = req?.body;

    if (!dupeWindow) dupeWindow = 30;

    const results = new DB.Result(req.app.locals.db);

    const result = await results.save({
        userHash: userHash,
        appId: appId,
        answers: answers,
        profile : profile,
        surveyId : surveyId
    });

    if (!result) {
        throw new GeneralError("Unable to create Result");
    }

    const emailItem = profile.find(p => p.key == 'email');

    startDate = moment().tz("America/New_York").subtract(dupeWindow, 'days').format('YYYY-MM-DD 00:00:00');
    endDate = moment().tz("America/New_York").format('YYYY-MM-DD 23:59:59');

    return res.json({prevSignUpsCount : await getResultCount(req.app.locals.db, emailItem?.value, surveyId, startDate, endDate)});
}));

router.get('/result', FindResultValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { userHash } = req?.query;

    if (!userHash) {
        return res.json(null);
        throw new GeneralError("Unable to find Result");
    }

    const results = new DB.Result(req.app.locals.db);

    const result = await results.search({ 'userHash': userHash}, {$natural : -1});

    return res.json(result[0]);
}));

router.get('/result/count', GetResultCountValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { email, surveyId } = req?.query;
    let { startDate, endDate } = req?.query;

    return res.json({result : await getResultCount(req.app.locals.db, email, surveyId , startDate, endDate)});
}));

const getResultCount = async (db, email, surveyId , startDate, endDate) => {
    if (!db || !email) return 0;

    if (!startDate) startDate = moment().tz("America/New_York").subtract(30, 'days').format('YYYY-MM-DD 00:00:00');
    if (!endDate) endDate = moment().tz("America/New_York").format('YYYY-MM-DD 23:59:59');

    const results = new DB.Result(db);

    const query = { 'profile.value': email, 'createdAt': { '$gte': new Date(startDate), $lte: new Date(endDate) } };

    if (surveyId) query.surveyId = surveyId;

    return await results.count(query);
};

module.exports = router;
