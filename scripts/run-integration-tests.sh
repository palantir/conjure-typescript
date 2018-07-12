#!/usr/bin/env bash

set -euo pipefail

./build/downloads/bin/conjure-verification-server ./build/resources/test-cases.json &
SERVER_PID=$!
yarn karma start --single-run --browsers ChromeHeadless karma.conf.js
kill -kill ${SERVER_PID}