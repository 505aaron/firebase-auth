const index = require('./');
const AWS = require('aws-sdk');

describe('Root Index', () => {
  test('runs without error', () => {
    index.handler('test', 'context');
  });
});
