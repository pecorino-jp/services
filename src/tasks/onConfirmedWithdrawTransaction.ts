import * as pecorino from '@pecorino/domain';
// tslint:disable-next-line:no-implicit-dependencies
import { Context } from 'aws-lambda';

import { connectMongo } from '../connectMongo';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

const SCHEDULE_RATE_IN_MILLISECONDS = 60000;
const INTERVAL_MILLISECONDS = 500;
const MAX_NUBMER_OF_TASKS = Math.floor(SCHEDULE_RATE_IN_MILLISECONDS / INTERVAL_MILLISECONDS);

/**
 * 確定転送取引のタスクエクスポート
 */
export default async (event: any, context: Context) => {
    return new Promise(async (resolve, reject) => {
        try {
            debug('event handled.', event);
            context.callbackWaitsForEmptyEventLoop = false;

            await connectMongo();

            let countStarted = 0;
            let countExecuted = 0;
            const taskRepo = new pecorino.repository.Task(pecorino.mongoose.connection);
            const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
            const timer = setInterval(
                async () => {
                    debug('countStarted / countExecuted:', countStarted, countExecuted);
                    if (countStarted >= MAX_NUBMER_OF_TASKS) {
                        if (countExecuted === countStarted) {
                            clearInterval(timer);
                            resolve();
                        }

                        return;
                    }

                    countStarted += 1;
                    try {
                        await pecorino.service.transaction.withdraw.exportTasks(
                            pecorino.factory.transactionStatusType.Confirmed
                        )({ task: taskRepo, transaction: transactionRepo });
                    } catch (error) {
                        console.error(error);
                    }
                    countExecuted += 1;
                },
                INTERVAL_MILLISECONDS
            );
        } catch (error) {
            reject(error);
        }
    });
};
