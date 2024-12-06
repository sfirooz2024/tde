const { createLogger, format, transports,addColors } = require('winston');
const { combine, timestamp, label, prettyPrint } = format;

const logger = createLogger({
    level: 'info',
    format: combine(
        format.colorize(),
        format.label(),
        format.json(),
        timestamp(),
        format.simple()        
    ),
    transports: [
        new transports.Console({
            format: format.colorize()               
        }),
    ],
});

module.exports = logger;
