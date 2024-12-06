const express = require('express');
const router = express.Router();
const { asyncHandler} = require('../../../common/helpers/error');
const { NotFoundError, ConflictError } = require('../../../common/helpers/error');
const { ValidatorMiddleware, CreateQuestionValidator, DeleteQuestionValidator, FindQuestionValidator, CreateSurveyValidator } = require('../../validator');
const DB = require('../../../common/models/db');

router.post('/questions/', CreateQuestionValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { _id, type, question, key, subheader, answers, header, name, condition, triggerContinueSurvey } = req.body;

    const questions = new DB.Question(req.app.locals.db);

    const questionsWithTheSameName =  await questions.checkIfQuestionNameInUse(name);

    if ( questionsWithTheSameName.filter(q => q._id != _id)?.length) throw new ConflictError(`Question name must be unique`);

    let questionObject = _id
        ? await questions.update( _id, {
            name: name,
            type: type,
            question: question,
            key: key,
            subheader: subheader,
            header: header,
            answers: answers,
            condition: condition,
            triggerContinueSurvey : triggerContinueSurvey
            })
        : await questions.save({
            name: name,
            type: type,
            question: question,
            key, key,
            subheader: subheader,
            header: header,
            answers: answers,
            condition: condition,
            triggerContinueSurvey : triggerContinueSurvey
        });
    
    if ( _id && !questionObject?._id) throw new NotFoundError('Invalid Question ID');
    else if (req.app.locals.cache) await req.app.locals.cache.deleteBasedOnPrefix('survey');

    return res.json({[questionObject?._id] : questionObject});
}));

router.get('/questions/', FindQuestionValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { ids } = req.query;

    const questions = new DB.Question(req.app.locals.db);

    const result = await (ids ? questions.listByIDs(ids) : questions.list(1000, 0));

    return res.json(result);
}));

router.get('/questions/conditional', FindQuestionValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { _id } = req.query;

    const questions = new DB.Question(req.app.locals.db);

    const result = await questions.findIfQuestionIsInConditional(_id);

    return res.json(result);
}));

router.get('/questions/surveys', FindQuestionValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { _id } = req.query;

    const surveys = new DB.Survey(req.app.locals.db);

    // First ensure question does not belong to any survey
    const surveysUsingQuestion = await surveys.checkIfQuestionInUse(_id);

    return res.json({surveys : surveysUsingQuestion});

}));

router.delete('/questions/', DeleteQuestionValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { _id } = req.body;

    let deletedQuestion = false;

    const questions = new DB.Question(req.app.locals.db);
    const surveys = new DB.Survey(req.app.locals.db);

    // First ensure question does not belong to any survey
    const surveysUsingQuestion = await surveys.checkIfQuestionInUse(_id);
    if (surveysUsingQuestion.length) throw new ConflictError(`Question cannot be deleted-- belongs to the surveys ${surveysUsingQuestion.map(survey => survey.name)}`);


    deletedQuestion = await questions.deleteByID(_id);

    if (req.app.locals.cache) await req.app.locals.cache.deleteBasedOnPrefix('survey');

    return res.json({successfullyDeleted : deletedQuestion});

}));

router.post('/surveys/', CreateSurveyValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { _id, affiliates, name } = req.body;
    let { advancedPages } = req.body;

    const surveys = new DB.Survey(req.app.locals.db);

    if (!_id && await surveys.checkByName(name)) throw new ConflictError(`Survey name must be unique`);

    const surveyObject = _id
        ? await surveys.update( _id, {
                name: name,
                advancedPages: advancedPages,
                affiliates: affiliates
            })
        : await surveys.save({
            name: name,
            advancedPages: advancedPages,
            affiliates: affiliates
        });
    
    if ( _id && !surveyObject?._id) throw new NotFoundError('Invalid Survey ID');
    else if (req.app.locals.cache) await req.app.locals.cache.deleteBasedOnPrefix('survey');

    return res.json({[surveyObject?._id] : surveyObject});
}));

router.get('/surveys/', ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { surveyId, affiliateId, limit, offset } = req.query;

    let cacheKey = `survey-`;

    if (affiliateId) cacheKey += affiliateId;
    else if (surveyId) cacheKey += surveyId;

    surveys = new DB.Survey(req.app.locals.db);

    let result = req.app.locals.cache ? await req.app.locals.cache.getValue(cacheKey) : null;
    
    if (!result)
        result = await surveys.findSurveysWithQuestions(affiliateId, surveyId, limit, offset);

    if (req.app.locals.cache) await req.app.locals.cache.setValue(cacheKey, result);
    
    return res.json({'surveys' : result});
}));

router.delete('/surveys/', DeleteQuestionValidator, ValidatorMiddleware, asyncHandler(async (req, res) => {
    const { _id } = req.body;

    const surveys = new DB.Survey(req.app.locals.db);

    const cacheKey = `survey-${_id}`;
    if (req.app.locals.cache) req.app.locals.cache.delValue(cacheKey);

    const deletedSurvey = await surveys.deleteByID(_id);

    return res.json({successfullyDeleted : deletedSurvey});
}));

module.exports = router;
