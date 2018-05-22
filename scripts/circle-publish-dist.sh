#!/usr/bin/env bash

if [ $# -lt 1 ]; then
    echo "Usage: $0 <file>"
    exit 1
fi

artifact_version=$CIRCLE_TAG
artifact_file="conjure-typescript-$artifact_version.tgz"

upload_url="https://api.bintray.com/content/palantir/conjure-typescript/com/palantir/conjure/typescript/conjure-typescript/${artifact_version}/${artifact_file}"
echo "publishing $1 to $upload_url"
set +x
curl --fail -v -X PUT "$upload_url" -T "$1" -u $BINTRAY_USERNAME:$BINTRAY_PASSWORD -d publish=1
set -x
