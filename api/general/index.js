const express = require('express');
const router = express.Router();
const { asyncHandler} = require('../../common/helpers/error');
const { ValidatorMiddleware } = require('../validator')

// List all answers by survey
router.get('/healthcheck', ValidatorMiddleware, asyncHandler(async (req, res) => {
    return res.json({healthcheck : true});
}));

module.exports = router;