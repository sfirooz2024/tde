const commonValidators = require('./../common/helpers/commonValidators');
const _ = require('lodash');
const { body, query, check } = require('express-validator');

const CreateImpressionValidator =
[
        body("surveyId").exists(),
        body("pageId").exists().isInt().toInt(),
        body("action").exists().isInt().toInt(),
        body("userAgent").exists(),
        body("ip").exists().isString(),
        body("appId").exists(),
        body("surveyAnswers").optional().isObject(),
        body("userHash").optional(),
        body("queryParams").optional().isObject()
];

const FindImpressionValidator =
[
        query("surveyId").optional().toArray().isArray(),
        query("appId").optional().toArray().isArray(),
        query("source").optional().toArray().isArray()
];

const CreateQuestionValidator =
[
        // Top level properties
        body("_id").optional().exists().isString(),
        body("name").exists().isString().isLength({ min: 1}),
        body("type").exists().isString().isLength({ min: 1}),
        body("question").exists().isString().isLength({ min: 1}),
        body("key").exists().isString().isLength({ min: 1}),
        body("subheader").optional( {nullable : true }).exists().isString(),
        body("header").optional( {nullable : true } ).exists().isString(),
        body("answers").toArray().isArray().not().isEmpty(),
        body("condition").optional( {nullable : true } ).exists().isArray(),
        body("triggerContinueSurvey").optional( {nullable : true }  ).exists().isBoolean(),

        // For full text
        body("answers.*.placeholder").optional().exists().isString(),
        body("answers.*.limit").optional().exists().isInt().toInt(),

        // For Dropdown
        body("answers.*.value").optional().exists().isString().isLength({ min: 1}),

        // Multi-choice-icon
        body("answers.*.text").optional().exists().isString().isLength({ min: 1}),
        body("answers.*.img").optional().exists( {nullable : true }  ).isString().isLength({ min: 1}),
        body("answers.*.class").optional().exists( {nullable : true }  ).isString(),
        body("answers.*.target").optional( {nullable : true }  ).exists().isString(),
        body("answers.*.disqualify").optional( {nullable : true }  ).exists().isBoolean(),

        // Slider
        body("answers.*.min").optional().exists().isInt().toInt(),
        body("answers.*.max").optional().exists().isInt().toInt(),
        body("answers.*.step").optional().exists().isInt().toInt(),

        // For Registration
        body("answers.*.tcpa").optional().exists().isString().isLength({ min: 1}),
        body("answers.*.regOptions").optional().exists().toArray().isArray(),
        body("answers.*.partners").optional().exists().toArray().isArray()
];

const FindQuestionValidator =
[
        query("ids").optional().exists().toArray().isArray(),
        query("_id").optional().isString().isLength({ min: 1})
];

const DeleteQuestionValidator =
[
        check('_id').exists().isString().isLength({ min: 1})
];

const CreateSurveyValidator =
[
        // Top level properties
        body("name").exists().isString().isLength({ min: 1}),
        body("pages").isObject(),
        body("advancedPages").optional().isObject(),
        body("affiliates").toArray().isArray().not().isEmpty()
];

const CreateResultValidator =
[
        body("userHash").exists().isString().isLength({ min: 1}),
        body("appId").exists().isString().isLength({ min: 1}),
        body("surveyId").optional({ nullable : true }).exists().isString().isLength({ min: 1}),
        body("answers").toArray().isArray().not().isEmpty(),
        body("profile").toArray().isArray().not().isEmpty(),
        body("answers.*.questionKey").exists(),
        body("answers.*.answer").exists(),
        body("dupeWindow").optional({ nullable : true }).exists().isInt().toInt()
];

const FindResultValidator =
[
        query("userHash").exists().isString().isLength({ min: 1})
];

const GetResultCountValidator =
[
        query("email").exists().isString().isLength({ min: 1}),
        query("surveyId").optional({ nullable : true }).exists().isString().isLength({ min: 1}),
        query("startDate").optional({ nullable : true }).exists().isISO8601().toDate(),
        query("endDate").optional({ nullable : true }).exists().isISO8601().toDate()
];

module.exports = _.merge({}, {
        CreateImpressionValidator,
        FindImpressionValidator,
        CreateQuestionValidator,
        FindQuestionValidator,
        DeleteQuestionValidator,
        CreateSurveyValidator,
        CreateResultValidator,
        FindResultValidator,
        GetResultCountValidator
}, commonValidators);
