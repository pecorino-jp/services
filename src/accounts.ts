import * as pecorino from '@pecorino/domain';
// tslint:disable-next-line:no-implicit-dependencies
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';
import { CREATED, NO_CONTENT, OK } from 'http-status';
import * as qs from 'qs';

import { connectMongo } from './connectMongo';
import errorHandler from './error';
import response from './response';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

/**
 * 口座検索
 */
export async function search(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        const queryStringParameters = qs.parse(qs.stringify(event.queryStringParameters));

        await connectMongo();

        debug('searching accounts...', queryStringParameters);
        const accountRepo = new pecorino.repository.Account(pecorino.mongoose.connection);
        const searchConditions: pecorino.factory.account.ISearchConditions<pecorino.factory.account.AccountType> = {
            // tslint:disable-next-line:no-magic-numbers
            limit: (queryStringParameters.limit !== undefined) ? Math.min(queryStringParameters.limit, 100) : 100,
            page: (queryStringParameters.page !== undefined) ? Math.max(queryStringParameters.page, 1) : 1,
            sort: (queryStringParameters.sort !== undefined) ? queryStringParameters.sort : { accountNumber: 1 },
            accountType: queryStringParameters.accountType,
            accountNumbers: (Array.isArray(queryStringParameters.accountNumbers)) ? queryStringParameters.accountNumbers : [],
            statuses: (Array.isArray(queryStringParameters.statuses)) ? queryStringParameters.statuses : [],
            name: queryStringParameters.name
        };
        const accounts = await accountRepo.search(searchConditions);

        return response(OK, accounts);
    } catch (error) {
        return errorHandler(error);
    }

    // callback(null, response);

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
}

export async function open(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        if (event.body === null) {
            throw new pecorino.factory.errors.Argument('body', 'body is null');
        }
        const body = JSON.parse(event.body);
        await connectMongo();

        const account = await pecorino.service.account.open({
            accountType: body.accountType,
            accountNumber: body.accountNumber,
            name: body.name,
            initialBalance: (body.initialBalance !== undefined) ? parseInt(body.initialBalance, 10) : 0
        })({
            account: new pecorino.repository.Account(pecorino.mongoose.connection)
        });

        return response(CREATED, account);
    } catch (error) {
        return errorHandler(error);
    }
}

export async function close(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        await connectMongo();
        if (event.pathParameters === null) {
            throw new pecorino.factory.errors.Argument('pathParameters', 'pathParameters is null');
        }

        await pecorino.service.account.close({
            accountType: event.pathParameters.accountType,
            accountNumber: event.pathParameters.accountNumber
        })({
            account: new pecorino.repository.Account(pecorino.mongoose.connection)
        });

        return response(NO_CONTENT, '');
    } catch (error) {
        return errorHandler(error);
    }
}

export async function searchMoneyTransferActions(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        const queryStringParameters = qs.parse(qs.stringify(event.queryStringParameters));
        await connectMongo();
        if (event.pathParameters === null) {
            throw new pecorino.factory.errors.Argument('pathParameters', 'pathParameters is null');
        }

        const actionRepo = new pecorino.repository.Action(pecorino.mongoose.connection);
        const searchConditions: pecorino.factory.action.transfer.moneyTransfer.ISearchConditions<pecorino.factory.account.AccountType> = {
            // tslint:disable-next-line:no-magic-numbers
            limit: (queryStringParameters.limit !== undefined) ? Math.min(queryStringParameters.limit, 100) : 100,
            page: (queryStringParameters.page !== undefined) ? Math.max(queryStringParameters.page, 1) : 1,
            sort: (queryStringParameters.sort !== undefined) ? queryStringParameters.sort : { endDate: -1 },
            accountType: event.pathParameters.accountType,
            accountNumber: event.pathParameters.accountNumber
        };
        const actions = await actionRepo.searchTransferActions(searchConditions);

        return response(OK, actions);
    } catch (error) {
        return errorHandler(error);
    }
}
