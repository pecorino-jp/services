import * as pecorino from '@pecorino/domain';
// tslint:disable-next-line:no-implicit-dependencies
import { Context } from 'aws-lambda';
import { NO_CONTENT, OK } from 'http-status';
import * as moment from 'moment';

import { connectMongo } from '../connectMongo';
import errorHandler from '../error';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

/**
 * 入金取引開始
 */
export async function start(event: any, context: Context) {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        const body = JSON.parse(event.body);

        await connectMongo();

        const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
        const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
        const transaction = await pecorino.service.transaction.withdraw.start({
            typeOf: pecorino.factory.transactionType.Withdraw,
            agent: {
                typeOf: body.agent.typeOf,
                id: (body.agent.id !== undefined) ? body.agent.id : event.requestContext.authorizer.principalId,
                name: body.agent.name,
                url: body.agent.url
            },
            recipient: {
                typeOf: body.recipient.typeOf,
                id: body.recipient.id,
                name: body.recipient.name,
                url: body.recipient.url
            },
            object: {
                clientUser: <any>{},
                amount: parseInt(body.amount, 10),
                fromAccountNumber: body.fromAccountNumber,
                notes: (body.notes !== undefined) ? body.notes : ''
            },
            expires: moment(body.expires).toDate()
        })({ account: accountRepo, transaction: transactionRepo });

        return {
            statusCode: OK,
            body: JSON.stringify(transaction)
        };
    } catch (error) {
        return errorHandler(error);
    }
}

export async function confirm(event: any, context: Context) {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        // const queryStringParameters = mapQueryString(event.queryStringParameters);

        await connectMongo();

        const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
        await pecorino.service.transaction.withdraw.confirm({
            transactionId: event.pathParameters.transactionId
        })({ transaction: transactionRepo });
        debug('transaction confirmed.');

        return {
            statusCode: NO_CONTENT
        };
    } catch (error) {
        return errorHandler(error);
    }
}

export async function cancel(event: any, context: Context) {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        // const queryStringParameters = mapQueryString(event.queryStringParameters);

        await connectMongo();

        const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
        await transactionRepo.cancel(pecorino.factory.transactionType.Withdraw, event.pathParameters.transactionId);
        debug('transaction canceled.');

        return {
            statusCode: NO_CONTENT
        };
    } catch (error) {
        return errorHandler(error);
    }
}
