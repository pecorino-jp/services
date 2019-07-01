import * as pecorino from '@pecorino/domain';
// tslint:disable-next-line:no-implicit-dependencies
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { NO_CONTENT, OK } from 'http-status';
import * as moment from 'moment';

import { connectMongo } from '../connectMongo';
import errorHandler from '../error';
import getUser from '../getUser';
import response from '../response';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

import lambda from '../lambda';

/**
 * 入金取引開始
 */
export async function start(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        if (event.body === null) {
            throw new pecorino.factory.errors.Argument('body', 'body is null');
        }
        const body = JSON.parse(event.body);
        await connectMongo();
        const sub = getUser(event);

        const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
        const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
        const transaction = await pecorino.service.transaction.withdraw.start({
            typeOf: pecorino.factory.transactionType.Withdraw,
            agent: {
                typeOf: body.agent.typeOf,
                id: (body.agent.id !== undefined) ? body.agent.id : sub,
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
                accountType: body.accountType,
                fromAccountNumber: body.fromAccountNumber,
                notes: (body.notes !== undefined) ? body.notes : ''
            },
            expires: moment(body.expires).toDate()
        })({ account: accountRepo, transaction: transactionRepo });

        return response(OK, transaction);
    } catch (error) {
        return errorHandler(error);
    }
}

export async function confirm(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        await connectMongo();
        if (event.pathParameters === null) {
            throw new pecorino.factory.errors.Argument('pathParameters', 'pathParameters is null');
        }

        const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
        await pecorino.service.transaction.withdraw.confirm({
            transactionId: event.pathParameters.transactionId
        })({ transaction: transactionRepo });
        debug('transaction confirmed.');

        await new Promise((resolve) => {
            lambda.invoke(
                {
                    FunctionName: `pecorino-${process.env.STAGE}-onConfirmedTransaction`,
                    InvocationType: 'Event',
                    LogType: 'Tail',
                    Payload: JSON.stringify({})
                },
                (err, data) => {
                    if (err) {
                        console.error(err);
                    } else {
                        debug('invokation result:', data);
                    }
                    resolve();
                }
            );
        });

        return response(NO_CONTENT, '');
    } catch (error) {
        return errorHandler(error);
    }
}

export async function cancel(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        await connectMongo();
        if (event.pathParameters === null) {
            throw new pecorino.factory.errors.Argument('pathParameters', 'pathParameters is null');
        }

        const transactionRepo = new pecorino.repository.Transaction(pecorino.mongoose.connection);
        await transactionRepo.cancel(pecorino.factory.transactionType.Withdraw, event.pathParameters.transactionId);
        debug('transaction canceled.');

        return response(NO_CONTENT, '');
    } catch (error) {
        return errorHandler(error);
    }
}
