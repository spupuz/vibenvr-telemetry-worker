#!/bin/bash
set -e
git fetch origin
git checkout master
git pull origin master

LAST_TAG=$(git tag --sort=-v:refname | head -1 || true)
LAST_TAG=${LAST_TAG:-v1.0.0}

NEW_VERSION=$(node -e '
const [tag] = process.argv.slice(1);
const [maj, minor, patch] = tag.replace(/^v/i, "").split(".").map(Number);
console.log(`v${maj}.${minor}.${patch + 1}`);
' "$LAST_TAG")

VER_NUM=${NEW_VERSION#v}
git checkout -b "release/$NEW_VERSION"

echo "Releasing $NEW_VERSION on vibenvr-telemetry-worker"
