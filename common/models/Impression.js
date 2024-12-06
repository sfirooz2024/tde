const Base = require("./Base");

class Impression extends Base {
    constructor(db) {
        super(db, "impressions")
        this.collection = db.collection('impressions');
    }

    async findAnswerCountInRange(startDate, endDate, appId, surveyId, source, limit, offset = 0, column, order) {

        const query = { 'createdAt': { '$gte': new Date(startDate), $lte: new Date(endDate) } };

        if (appId) query.appId = { $in: appId };

        if (surveyId) query.surveyId = { $in: surveyId };

        if (source) query['additional.queryParams.sr'] = { $in: source };

        // Allow sorting
        let sortOptions = ['count', '_id.qid', '_id.answer', '_id.surveyId'];

        let prioritizedSorting = (column && order) ? sortOptions.find(item => item.includes(column)) : null;

        let sortingOrder = new Map();

        if (prioritizedSorting) sortingOrder.set(prioritizedSorting, (order === 'descend' ? -1 : 1));

        for (const item of sortOptions) if (!item.includes(column)) sortingOrder.set(item, -1);

        const detailedReport = [
            {
                $group:
                {
                    _id: { qid: '$surveyAnswers.k', answer: "$surveyAnswers.v", surveyId: "$surveyId", source: "$queryParams.sr" },
                    count: { $sum: 1, },
                }
            },
            { $sort: sortingOrder }
        ];

        if (limit) detailedReport.push({ $limit: limit + offset });
        if (offset) detailedReport.push({ $skip: offset });

        const pipeline = [
            { $match: query },
            {
                $project: {
                    "surveyId": "$surveyId", "surveyAnswers":
                        { $objectToArray: "$additional.surveyAnswers" }, queryParams : "$additional.queryParams"
                }
            },
            { $unwind: '$surveyAnswers' },
            {
                $facet: {
                    "detailed": detailedReport,
                    "total": [
                        {
                            $group:
                            {
                                _id: { qid: '$surveyAnswers.k', surveyId: "$surveyId" },
                                count: { $sum: 1 },
                            }
                        },
                    ],
                    "count": [
                        {
                            $group:
                            {
                                _id: { qid: '$surveyAnswers.k', answer: "$surveyAnswers.v", surveyId: "$surveyId" },
                                count: { $sum: 1 },
                            }
                        },
                        {
                            $group:
                            {
                                _id: null,
                                count: { $sum: 1 },
                            }
                        },
                    ]
                }
            }

        ];

        const result = this.collection.aggregate(pipeline);
        return await result.toArray();
    }

    async findActionCountInRange(startDate, endDate, appId, surveyId, source, limit, offset = 0, column, order) {

        const query = { 'createdAt': { '$gte': new Date(startDate), $lte: new Date(endDate) } };

        if (appId) query.appId = { $in: appId };

        if (surveyId) query.surveyId = { $in: surveyId };

        if (source) query['additional.queryParams.sr'] = { $in: source };

        let sortOptions = ['count', '_id.surveyId', '_id.action', '_id.pageId'];

        let prioritizedSorting = (column && order) ? sortOptions.find(item => item.includes(column)) : null;

        let sortingOrder = new Map();

        if (prioritizedSorting) sortingOrder.set(prioritizedSorting, (order === 'descend' ? -1 : 1));

        for (const item of sortOptions) if (!item.includes(column)) sortingOrder.set(item, -1);

        const detailedReport = [
            { $sort: sortingOrder } 
        ];

        if (limit) detailedReport.push({ $limit: limit + offset });
        if (offset) detailedReport.push({ $skip: offset });

        const pipeline = [
            { $match: query },
            {
                $project : {
                  action : { $switch: {
                        "branches" :[
                            { case: { $eq: [ '$action', 1 ] }, then: "Continue" },
                            { case: { $eq: [ '$action', 2 ] }, then: "Registration" },
                            { case: { $eq: [ '$action', 3 ] }, then: "Impression" },
                        ], default: null
                    }},
                    surveyId: "$surveyId",  pageId: "$pageId", queryParams : "$additional.queryParams"
                }
            },
            {
                $group:
                {
                    _id: { action: '$action', surveyId: "$surveyId", pageId: "$pageId", source: "$queryParams.sr" },
                    count: { $sum: 1 },
                }
            },
            {
                $facet: {
                    "detailed": detailedReport,
                    "total" : [
                        {
                            $lookup:
                            {
                                from: "surveys",
                                localField: "_id.surveyId",
                                foreignField: "_id",
                                as: "survey"
                            }
                        },
                        {$set: {survey: {"$arrayElemAt": [ "$survey", 0 ] }}},
                        {
                            $group:
                            {
                                _id: { action: '$_id.action', surveyId: "$_id.surveyId", pageId: "$_id.pageId" },
                                count: { $sum: '$count' }
                            }
                        }
                    ],
                    "count": [
                        {
                            $group:
                            {
                                _id: null,
                                count: { $sum: 1 },
                            }
                        },
                    ]
                }
            }
        ];

        const result = this.collection.aggregate(pipeline);
        return await result.toArray();
    }

    async getSourcesFromTimePeriod(startDate, endDate) {
        const query = { 'createdAt': { '$gte': new Date(startDate), $lte: new Date(endDate) } };
        const result = await this.collection.distinct('additional.queryParams.sr', query);
        return result;
    }

    async findBasicTotalStats(startDate, endDate, appId, surveyId) {

        const query = { 'createdAt': { '$gte': new Date(startDate), $lte: new Date(endDate) }, 'appId' : appId };

        if (surveyId) query['surveyId'] = surveyId;
        
        const firstPage = 1;
        const secondPage = 2;

        const lastPageExample = await this.collection.find(query).sort({pageId:-1}).limit(1).toArray();

        const lastPage = lastPageExample[0]?.pageId || 1;

        const pipeline = [
            { $match: query },
            {
                $group: {
                    _id: null,
                    firstPageImpression: {$sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$pageId', firstPage] },
                                    { $eq: ['$action', 3] },
                                ]
                            }, 1, 0
                        ]
                    }},
                    secondPageImpression: {$sum: {
                            $cond: [
                                {
                                    $and: [
                                        { $eq: ['$pageId', secondPage] },
                                        { $eq: ['$action', 3] },
                                    ]
                                }, 1, 0
                            ]
                        }},
                    lastPageImpression: {$sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$pageId', lastPage] },
                                    { $eq: ['$action', 3] },
                                ]
                            }, 1, 0
                        ]
                    }},
                    registration: {$sum: {
                        $cond: [
                            {
                                $and: [
                                    { $eq: ['$action', 2] },
                                ]
                            }, 1, 0
                        ]
                    }},
                }
            }
        ];

        const result = await this.collection.aggregate(pipeline).toArray();
        
        return result && result[0] ? result[0] : null;
    }

}

module.exports = Impression;
