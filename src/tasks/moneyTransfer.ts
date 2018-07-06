import * as pecorino from '@motionpicture/pecorino-domain';
// tslint:disable-next-line:no-implicit-dependencies
import { Context } from 'aws-lambda';

import { connectMongo } from '../connectMongo';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

const SCHEDULE_RATE_IN_MILLISECONDS = 60000;
const INTERVAL_MILLISECONDS = 500;
const MAX_NUBMER_OF_TASKS = Math.floor(SCHEDULE_RATE_IN_MILLISECONDS / INTERVAL_MILLISECONDS);

/**
 * Money転送タスク
 */
export default async (event: any, context: Context) => {
    return new Promise(async (resolve, reject) => {
        try {
            debug('event handled.', event);
            context.callbackWaitsForEmptyEventLoop = false;

            await connectMongo();

            let countTasks = 0;
            let countStarted = 0;
            let countExecuted = 0;
            const taskRepo = new pecorino.repository.Task(pecorino.mongoose.connection);
            const timer = setInterval(
                async () => {
                    countTasks += 1;
                    debug('countTasks / countStarted / countExecuted:', countTasks, countStarted, countExecuted);
                    if (countTasks > MAX_NUBMER_OF_TASKS) {
                        if (countExecuted === countStarted) {
                            debug('ending...');
                            clearInterval(timer);
                            resolve();
                        }

                        return;
                    }

                    countStarted += 1;

                    try {
                        await pecorino.service.task.executeByName(
                            pecorino.factory.taskName.MoneyTransfer
                        )({ taskRepo: taskRepo, connection: pecorino.mongoose.connection });
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
