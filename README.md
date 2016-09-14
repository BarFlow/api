# BarFlow API

## Overview

This api is built to support our mobile and web applications. It is developed by the following swagger specification: [Documentation](http://petstore.swagger.io/?url=https://gist.githubusercontent.com/petergombos/b22db27aee9838a63adf6f365b0a0379/raw/BarFlow-swagger.json#!/default/)

## Getting Started

Clone the repo:
```sh
git clone https://github.com/BarFlow/api.git
cd api
```

Install dependencies:
```sh
npm install
```

Start server:
```sh
# set DEBUG env variable to get debug logs
DEBUG=barflow-api:* npm start
# OR
# requires gulp to be installed globally
npm i -g gulp
gulp serve
```

Execute tests:
```sh
# compile with babel and run tests
npm test (or gulp mocha)

# use --code-coverage-reporter text to get code coverage for each file
gulp mocha --code-coverage-reporter text
```

Other gulp tasks:
```sh
# Wipe out dist and coverage directory
gulp clean

# Lint code with ESLint
gulp lint

# Default task: Wipes out dist and coverage directory. Compiles using babel.
gulp
```

#### API logging
Logs detailed info about each api request to console during development.

#### Error logging
Logs stacktrace of error to console along with other details.

## Code Coverage
Get code coverage summary on executing `npm test`

`npm test` also generates HTML code coverage report in `coverage/` directory. Open `lcov-report/index.html` to view it.

## A Boilerplate-only Option

If you would prefer not to use any of our tooling, delete the following files from the project: `package.json`, `gulpfile.babel.js`, `.eslintrc` and `.travis.yml`. You can now safely use the boilerplate with an alternative build-system or no build-system at all if you choose.

## Meta
Project is based on Kunal Kapadia's [@kunalkapadia12](https://twitter.com/KunalKapadia12) [express-mongoose-es6-rest-api](https://github.com/KunalKapadia/express-mongoose-es6-rest-api)
