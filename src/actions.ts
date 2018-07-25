// import * as pecorino from '@pecorino/domain';
// tslint:disable-next-line:no-implicit-dependencies
import { Callback, Context } from 'aws-lambda';

import { OK } from 'http-status';

import { connectMongo } from './connectMongo';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

/**
 * アクション検索
 */
export async function search(event: any, context: Context, callback: Callback) {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;

        await connectMongo();

        callback(null, {
            statusCode: OK,
            body: JSON.stringify([])
        });
    } catch (error) {
        callback(error);
    }
}
