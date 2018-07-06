// import * as pecorino from '@motionpicture/pecorino-domain';
// tslint:disable-next-line:no-implicit-dependencies
import { Callback, Context } from 'aws-lambda';

import { NO_CONTENT, OK } from 'http-status';

import { connectMongo } from '../connectMongo';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

/**
 * 入金取引開始
 */
export async function start(event: any, context: Context, callback: Callback) {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;

        await connectMongo();

        callback(null, {
            statusCode: OK,
            body: JSON.stringify({
                id: '12345'
            })
        });
    } catch (error) {
        callback(error);
    }
}

export async function confirm(event: any, context: Context, callback: Callback) {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        // const queryStringParameters = mapQueryString(event.queryStringParameters);

        await connectMongo();

        callback(null, {
            statusCode: NO_CONTENT
        });
    } catch (error) {
        callback(error);
    }
}

export async function cancel(event: any, context: Context, callback: Callback) {
    debug('event handled.', event);
    try {
        context.callbackWaitsForEmptyEventLoop = false;
        // const queryStringParameters = mapQueryString(event.queryStringParameters);

        await connectMongo();

        callback(null, {
            statusCode: NO_CONTENT
        });
    } catch (error) {
        callback(error);
    }
}
