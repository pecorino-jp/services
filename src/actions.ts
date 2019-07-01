// import * as pecorino from '@pecorino/domain';
// tslint:disable-next-line:no-implicit-dependencies
import { APIGatewayEvent, APIGatewayProxyResult, Context } from 'aws-lambda';

import { OK } from 'http-status';

import { connectMongo } from './connectMongo';
import errorHandler from './error';
import response from './response';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

/**
 * アクション検索
 */
export async function search(event: APIGatewayEvent, context: Context): Promise<APIGatewayProxyResult> {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        await connectMongo();

        return response(OK, []);
    } catch (error) {
        return errorHandler(error);
    }
}
