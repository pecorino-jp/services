// tslint:disable-next-line:no-implicit-dependencies
import { Callback, Context } from 'aws-lambda';

import * as createDebug from 'debug';
const debug = createDebug('pecorino:*');

/**
 * helloイベント
 */
export async function hello(event: any, _: Context, callback: Callback) {
    try {
        debug('hello!', event);
        // const data = JSON.parse(event.body);

        const response = {
            statusCode: 200,
            body: JSON.stringify({
                message: 'Go Serverless v1.0! Your function executed successfully!',
                input: event
            })
        };

        callback(null, response);
    } catch (error) {
        callback(error);
    }

    // callback(null, response);

    // Use this code if you don't use the http event with the LAMBDA-PROXY integration
    // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
}

// export async function messages(event: any, _: lambda.Context, callback: lambda.Callback) {
//     try {
//         const body = <any>querystring.parse(event.body);
//         const data = JSON.parse(body.payload);
//         console.log('messages:', data);

//         switch (data.type) {
//             case 'interactive_message':
//                 await handleInteractiveMessage(data, callback);
//                 break;

//             default:
//                 callback(null);
//         }
//     } catch (error) {
//         callback(error);
//     }

//     // callback(null, response);

//     // Use this code if you don't use the http event with the LAMBDA-PROXY integration
//     // callback(null, { message: 'Go Serverless v1.0! Your function executed successfully!', event });
// };
