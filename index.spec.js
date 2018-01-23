const index = require('./');

describe('Root Index', () => {
  test('runs without error', () => {
    index.handler('test', 'context');
  });
});
