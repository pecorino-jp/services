import * as AWS from 'aws-sdk';

/**
 * AWS Lambda サービス
 */
export default new AWS.Lambda({
    region: <string>process.env.COGNITO_REGION
    // accessKeyId: <string>process.env.AWS_ACCESS_KEY_ID,
    // secretAccessKey: <string>process.env.AWS_SECRET_ACCESS_KEY
    // endpoint: 'http://localhost:4000'
});
