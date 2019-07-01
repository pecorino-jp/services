import * as pecorino from '@pecorino/domain';
// tslint:disable-next-line:no-implicit-dependencies
import { APIGatewayEvent } from 'aws-lambda';

/**
 * イベントからユーザーを取り出す
 */
export default (event: APIGatewayEvent): string => {
    if (event.requestContext.authorizer === undefined || event.requestContext.authorizer === null) {
        throw new pecorino.factory.errors.Forbidden('Login required');
    }

    return event.requestContext.authorizer.principalId;
};
