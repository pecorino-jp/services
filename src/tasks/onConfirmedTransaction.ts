import * as pecorino from '@pecorino/domain';
// tslint:disable-next-line:no-implicit-dependencies
import { Context, ScheduledEvent } from 'aws-lambda';

import { connectMongo } from '../connectMongo';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

import lambda from '../lambda';

/**
 * 取引確定トリガー
 */
export default async (event: ScheduledEvent, context: Context): Promise<void> => {
    try {
        debug('event handled.', event);
        context.callbackWaitsForEmptyEventLoop = false;
        await connectMongo();

        const taskRepo = new pecorino.repository.Task(pecorino.mongoose.connection);
        const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
        const invocationRequest = {
            FunctionName: `pecorino-${process.env.STAGE}-moneyTransfer`,
            InvocationType: 'Event',
            LogType: 'Tail',
            Payload: JSON.stringify({})
        };

        await pecorino.service.transaction.deposit.exportTasks(
            pecorino.factory.transactionStatusType.Confirmed
        )({ task: taskRepo, transaction: transactionRepo });
        await new Promise((resolve) => {
            lambda.invoke(invocationRequest, resolve);
        });

        await pecorino.service.transaction.transfer.exportTasks(
            pecorino.factory.transactionStatusType.Confirmed
        )({ task: taskRepo, transaction: transactionRepo });
        await new Promise((resolve) => {
            lambda.invoke(invocationRequest, resolve);
        });

        await pecorino.service.transaction.withdraw.exportTasks(
            pecorino.factory.transactionStatusType.Confirmed
        )({ task: taskRepo, transaction: transactionRepo });
        await new Promise((resolve) => {
            lambda.invoke(invocationRequest, resolve);
        });
    } catch (error) {
        throw error;
    }
};
