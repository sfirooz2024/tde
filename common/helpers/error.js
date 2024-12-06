const HttpCodes = require('http-status-codes');

class GeneralError extends Error {
    constructor(message) {
        super();
        this.message = message;
        this.statusCode = HttpCodes.StatusCodes.INTERNAL_SERVER_ERROR;
    }

    getCode() {
        if (this instanceof BadRequestError) {
            return 400;
        } if (this instanceof NotFoundError) {
            return 404;
        }
        return 500;
    }
}

class BadRequestError extends GeneralError {
    constructor(message) {
        super(message);
        this.statusCode = HttpCodes.StatusCodes.BAD_REQUEST;
    }
}

class NotFoundError extends GeneralError {
    constructor(message) {
        super(message);
        this.statusCode = HttpCodes.StatusCodes.NOT_FOUND;
    }
}

class UnauthorizedError extends GeneralError {
    constructor(message) {
        super(message);
        this.statusCode = HttpCodes.StatusCodes.UNAUTHORIZED;
    }
}

class ConflictError extends GeneralError {
    constructor(message) {
        super(message);
        this.statusCode = HttpCodes.StatusCodes.CONFLICT;
    }
}

class ForbiddenError extends GeneralError {
    constructor(message) {
        super(message);
        this.statusCode = HttpCodes.StatusCodes.FORBIDDEN;
    }
}

const asyncHandler = fn => (req, res, next) => {
    return Promise
        .resolve(fn(req, res, next))
        .catch(next);
};

module.exports = {
    GeneralError,
    BadRequestError,
    NotFoundError,
    UnauthorizedError,
    ForbiddenError,
    ConflictError,
    asyncHandler
};
