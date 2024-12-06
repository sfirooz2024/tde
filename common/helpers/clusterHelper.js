const logger = require('./../logging/logger');
const cluster = require('cluster');

const clusterHelper = (clusterCount, fn, masterInitFn) => {
    try {
        if (clusterCount && clusterCount > 1) {
            
            if (cluster?.isMaster) {
                logger.info('Clustering is active, cluster count : ' + clusterCount);
                for (let i = 0; i < clusterCount; i++) {
                    cluster.fork();
                }
                cluster.on('online', function (worker) {
                    logger.info('Worker ' + worker.process.pid + ' is online');
                });
    
                cluster.on('exit', function (worker, code, signal) {
                    logger.info('Worker ' + worker.process.pid + ' died with code: ' + code + ', and signal: ' + signal);
                    logger.info('Starting a new worker');
                    cluster.fork();
                });
                try {
                    if (masterInitFn) {
                        masterInitFn();
                    }    
                }
                catch (error) {
                    console.log(error);
                }                
            }
            else {
                try {
                    fn(cluster.worker.id);
                }
                catch (error) {
                    logger.error(error);
                    process.exit(1);
                }
                logger.info('Worker ' + cluster.worker.id + ' is starting');               
            }
        }
        else {
            try {
                fn("");
            } catch (error) {
                logger.error(error);
                process.exit(1);
            }
            if (masterInitFn) {
                masterInitFn();
            }
        }
    }
    catch (error) {
        console.log(error);   
    }
}

module.exports = clusterHelper;
