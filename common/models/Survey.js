const Base = require("./Base");

class Survey extends Base {
    constructor(db) {
        super(db, "surveys")
        this.collection = db.collection('surveys');
    }
    async findSurveysWithQuestions(affiliateId, surveyId, limit, offset = 0) {

        const query = affiliateId ? { 'affiliates': affiliateId } : {};

        if (surveyId) query['_id'] = surveyId;

        const detailedReport = [
            { $sort: { 'count': -1, '_id.surveyId': -1, '_id.action': -1, '_id.pageId': -1 } }
        ];

        if (limit) detailedReport.push({ $limit: limit + offset });
        if (offset) detailedReport.push({ $skip: offset });

        const pipeline = [
            { $match: query },
            {
                $facet: {
                    "advanced": [
                        {
                            $project: {
                                advancedPages: { $objectToArray: '$advancedPages' }, affiliates: 1, name: 1, regBtnText: 1, phone : 1
                            }
                        },
                        {
                            $lookup:
                            {
                                from: "questions",
                                localField: "advancedPages.v.questions",
                                foreignField: "_id",
                                as: "values"
                            }
                        },
                        {
                            $group: {
                                "_id": null, "data": {
                                    "$push": {
                                        "k": "$_id", "v": {
                                            values: "$values", advancedPages: "$advancedPages", name: "$name", _id: "$_id", regBtnText : '$regBtnText', phone : '$phone'
                                        }
                                    }
                                }
                            }
                        },
                        { $replaceRoot: { "newRoot": { "$arrayToObject": "$data" } } }
                    ],
                    "surveys": [
                        {
                            $group: {
                                "_id": null, "data": {
                                    "$push": {
                                        "k": "$_id", "v": {
                                            _id: "$_id", name: "$name", affiliates: "$affiliates", advancedPages: "$advancedPages", regBtnText : '$regBtnText', phone : '$phone'
                                        }
                                    }
                                }
                            }
                        },

                        { $replaceRoot: { "newRoot": { "$arrayToObject": "$data" } } }
                    ],
                    "questions": [
                        {
                            $project: {
                                questions: { $objectToArray: '$advancedPages' }
                            }
                        },
                        {$set: {questionIds: {"$arrayElemAt": [ "$questions.v.questions", 0 ] }}},
                        { $unwind: '$questionIds'},
                        {
                            $lookup:
                            {
                                from: "questions",
                                localField: "questionIds",
                                foreignField: "_id",
                                as: "questions"
                            }
                        },
                        { $unwind: "$questions" },
                        {
                            $group: {
                                "_id": "null", "data": {
                                    "$push": {
                                        "k": "$questions._id", "v": {
                                            type: "$questions.type", question: "$questions.question", key: "$questions.key", subheader: "$questions.subheader", header: "$questions.header", answers: "$questions.answers"
                                        }
                                    }
                                }
                            }
                        },
                        { $replaceRoot: { "newRoot": { "$arrayToObject": "$data" } } }
                    ]
                }
            },
        ];

        const result = await this.collection.aggregate(pipeline).toArray();

        // Reformat advancedPages
        for (const advancedKey in result[0].advanced[0]) {
            const advanced = result[0].advanced[0][advancedKey];
            let advancedPages = {};
            // For every page, replace ID with object
            for (const pg of advanced.advancedPages) {
                advancedPages[pg.k] = { questions : [], headerText : pg.v?.headerText};           
                for (const q of pg.v?.questions)advancedPages[pg.k].questions.push(advanced.values.find(v => q == v._id));
            }
            result[0].advanced[0][advancedKey].advancedPages = advancedPages;
            delete result[0].advanced[0][advancedKey].values;
        }
        return result[0];

    }

    async checkIfQuestionInUse(questionId) {
        if (!questionId) return [];

        const result = await this.collection.aggregate([
            {
                $project: { advancedPages: { '$objectToArray': "$advancedPages" }, name: 1 }
            },
            {
                $match: { 'advancedPages.v.questions': questionId }
            },
            {
                $project: { name: 1 }
            }

        ]).toArray() 

        return result;
    }
}

module.exports = Survey;
