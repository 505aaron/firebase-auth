const Promise = require('bluebird');
const admin = require('firebase-admin');
const AWS = require('aws-sdk');
const AuthPolicy = require('./lib/AuthPolicy');

const s3 = new AWS.S3();
const getObject = Promise.promisify(s3.getObject, { context: s3 });

const createFirebaseAdmin = (databaseURL, bucket, bucketKey) =>
  getObject({
    Bucket: bucket,
    Key: bucketKey,
  }).then(data =>
    admin.initializeApp({
      credential: data.Body,
      databaseURL,
    }));

exports.handler = (event, context) => {
  const bucket = process.env.BUCKET_NAME;
  const firebaseUrl = process.env.FIREBASE_URL;
  const firebaseKey = process.env.FIREBASE_SDK_KEY;

  console.log('Method ARN: ', event.methodArn);

  createFirebaseAdmin(firebaseUrl, bucket, firebaseKey)
    .then(() => admin.auth().verifyIdToken(event.authorizationToken))
    .then((verifiedToken) => {
      // TODO: Remove
      console.log('Firebase token', verifiedToken);

      // parse the ARN from the incoming event
      const tmp = event.methodArn.split(':');
      const apiGatewayArnTmp = tmp[5].split('/');
      const awsAccountId = tmp[4];

      const apiOptions = {
        region: tmp[3],
        restApiId: apiGatewayArnTmp[0],
        stage: apiGatewayArnTmp[1],
      };

      const policy = new AuthPolicy(verifiedToken.uid, awsAccountId, apiOptions);

      const graphql = `/graphql/?uid=${verifiedToken.uid}`;
      policy.allowMethod(AuthPolicy.HttpVerb.GET, graphql);
      policy.allowMethod(AuthPolicy.HttpVerb.POST, graphql);

      const built = policy.build();

      // TODO: Remove
      console.log('Policy DELETE', built);
      context.succeed(built);
    })
    .catch((e) => {
      console.error('Failed to authenticate', e);
      context.fail('Unauhtorized');
    });
};
