const Base = require("./Base");

class Question extends Base {
    constructor(db) {
        super(db, "questions")
        this.collection = db.collection('questions');
    }

    async checkIfQuestionNameInUse(questionName) {
        if (!questionName) return [];
        const result = await this.collection.find( { name: questionName }, {name : 1} ).toArray();
        return result;
    }

    async findIfQuestionIsInConditional(id) {
        const result = await this.collection.aggregate([
            { $unwind: '$condition'},
            { $match: {
                "condition" : {$elemMatch: { [id]: { $exists: true }
                }
            }}}
        ]).toArray();
        return result;
    }
}

module.exports = Question;
