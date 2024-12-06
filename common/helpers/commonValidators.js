const { query, body, validationResult} = require('express-validator');
const { BadRequestError, asyncHandler } = require('./error');

const DateSearchValidator = [
    query("startDate").isISO8601().toDate(),
    query("endDate").isISO8601().toDate()
]

const PaginateValidator = [
    query("limit").optional().isInt().toInt(),
    query("offset").optional().isInt().toInt(),
    body("limit").optional().isInt().toInt(),
    body("offset").optional().isInt().toInt()
]

const ValidatorMiddleware = asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const errorMessage = errors.array().map(x => `${x.msg} '${x.value}' for param ${x.param}`).join(' | ');
        throw new BadRequestError(errorMessage);
    }
    next();
});

module.exports = {
    ValidatorMiddleware,
    DateSearchValidator,
    PaginateValidator
}
