const Promise = require('bluebird');
const admin = require('firebase-admin');
const AWS = require('aws-sdk');
const { AuthPolicy } = require('./lib/AuthPolicy');

const s3 = new AWS.S3();
const getObject = Promise.promisify(s3.getObject, { context: s3 });

const createFirebaseAdmin = (databaseURL, bucket, bucketKey) => {
  try {
    admin.app();
    // App is initialized.
    return Promise.resolve();
  } catch (e) {
    console.log('Initializing firebase admin');
    return getObject({
      Bucket: bucket,
      Key: bucketKey,
    }).then((data) => {
      const credential = JSON.parse(data.Body.toString('utf8'));
      admin.initializeApp({
        credential: admin.credential.cert(credential),
        databaseURL,
      });
    });
  }
};

exports.handler = (event, context) => {
  const bucket = process.env.BUCKET_NAME;
  const firebaseUrl = process.env.FIREBASE_URL;
  const firebaseKey = process.env.FIREBASE_SDK_KEY;
  const { headers: { Authorization: authToken } } = event;

  createFirebaseAdmin(firebaseUrl, bucket, firebaseKey)
    .then(() => admin.auth().verifyIdToken(authToken))
    .then(({ sub }) => {
      // parse the ARN from the incoming event
      const tmp = event.methodArn.split(':');
      const apiGatewayArnTmp = tmp[5].split('/');
      const awsAccountId = tmp[4];

      const apiOptions = {
        region: tmp[3],
        restApiId: apiGatewayArnTmp[0],
        stage: apiGatewayArnTmp[1],
      };

      const policy = new AuthPolicy(sub, awsAccountId, apiOptions);

      policy.allowMethod(AuthPolicy.HttpVerb.GET, '/graphql');
      policy.allowMethod(AuthPolicy.HttpVerb.POST, '/graphql');

      const built = policy.build();

      context.succeed(built);
    })
    .catch((e) => {
      console.error('Failed to authenticate', e);
      let message = 'Unauthorized';
      if (typeof e !== 'undefined' && e.errorMessage != null) {
        message = e.errorMessage;
      }

      context.fail(message);
    });
};
