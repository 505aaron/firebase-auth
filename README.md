# firebase-auth
A firebase authentication AWS lambda function

## Installation

`yarn install firebase-auth`

### Deployment
This is the simplest case for deployment to ease quick development. You should use a CI/CD platform as you scale development.

`yarn acrhive`

Upload zip to AWS lambda.

## Development

### Install

`yarn install`

### Run

`yarn server`

### Test

Run all tests
`yarn test`

With watch
`yarn test:watch`

### Upgrade Lint
This project uses Airbnb base lint rules. It is kind of a pain to upgrade these dependencies. Use the following:

```bash
(
  export PKG=eslint-config-airbnb-base;
  npm info "$PKG@latest" peerDependencies --json | command sed 's/[\{\},]//g ; s/: /@/g' | xargs yarn add --dev "$PKG@latest"
)
```
