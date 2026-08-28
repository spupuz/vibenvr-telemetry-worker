#!/bin/bash
set -e

REPO_NAME=$(basename -s .git `git config --get remote.origin.url` 2>/dev/null || basename "$PWD")
if [[ "$REPO_NAME" == "VibeNVR-site" || "$REPO_NAME" == "vibe-nvr-site" ]]; then
  DEFAULT_BRANCH="main"
elif [[ "$REPO_NAME" == "vibenvr-telemetry-worker" ]]; then
  DEFAULT_BRANCH="master"
else
  echo "Error: This workflow can only be used for the site or telemetry repositories."
  exit 1
fi

echo "Checking Open PRs..."
gh pr list --state open --json number,title,headRefName > open_prs.json
cat open_prs.json

echo "Fetching & Creating Release Branch..."
git fetch origin
git checkout $DEFAULT_BRANCH
git pull origin $DEFAULT_BRANCH

LAST_TAG=$(git tag --sort=-v:refname | head -1 || true)
LAST_TAG=${LAST_TAG:-v1.0.0}

NEW_VERSION=$(node -e '
const [tag] = process.argv.slice(1);
const [maj, minor, patch] = tag.replace(/^v/i, "").split(".").map(Number);
console.log(`v${maj}.${minor}.${patch + 1}`);
' "$LAST_TAG")

VER_NUM=${NEW_VERSION#v}
git checkout -b "release/$NEW_VERSION"

echo "Reviewing & Merging PRs..."
for headRefName in $(jq -r '.[].headRefName' open_prs.json); do
  echo "Merging $headRefName..."
  git merge origin/$headRefName --no-edit
done

echo "Bumping Version in UI..."
if [[ "$REPO_NAME" == "VibeNVR-site" || "$REPO_NAME" == "vibe-nvr-site" ]]; then
  sed -i -E "s/>v[0-9]+\.[0-9]+\.[0-9]+</>v$VER_NUM</" src/header.html || true
elif [[ "$REPO_NAME" == "vibenvr-telemetry-worker" ]]; then
  sed -i -E "s/>v[0-9]+\.[0-9]+\.[0-9]+</>v$VER_NUM</" src/dashboard.js || true
fi

echo "Removing Stray Files & Committing..."
git rm -rf .agents .wrangler .env .dev.vars 2>/dev/null || true
git add -A
git commit -m "v$VER_NUM: merge PRs and bump version" || true

echo "Merging to Main/Master & Pushing..."
git checkout $DEFAULT_BRANCH
git merge release/$NEW_VERSION --no-edit
git branch -d release/$NEW_VERSION
git push origin $DEFAULT_BRANCH

echo "Tagging and Publishing Release Notes..."
git tag "$NEW_VERSION"
git push origin $DEFAULT_BRANCH --tags

TODAY=$(date +%Y-%m-%d)
NOTES="## [$VER_NUM] - $TODAY

### Changed
- Merged all pending optimization and security PRs.
"

gh release create "$NEW_VERSION" --title "$NEW_VERSION" --notes "$NOTES"
