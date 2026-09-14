set -e
export REPO_NAME=$(basename -s .git `git config --get remote.origin.url` 2>/dev/null || basename "$PWD")
if [[ "$REPO_NAME" == "vibe-nvr-site" || "$REPO_NAME" == "VibeNVR-site" ]]; then
  DEFAULT_BRANCH="main"
elif [[ "$REPO_NAME" == "vibenvr-telemetry-worker" ]]; then
  DEFAULT_BRANCH="master"
else
  echo "Error: This workflow can only be used for the site or telemetry repositories. Found $REPO_NAME"
  exit 1
fi

echo "REPO: $REPO_NAME, DEFAULT_BRANCH: $DEFAULT_BRANCH"

gh pr list --state open --json number,title,headRefName > open_prs.json
PR_COUNT=$(cat open_prs.json | grep '"number"' | wc -l)

if [ "$PR_COUNT" -eq 0 ]; then
  echo "No open PRs found."
  exit 0
fi

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
echo "New version will be $NEW_VERSION"

git checkout -b "release/$NEW_VERSION"

for row in $(cat open_prs.json | jq -r '.[] | @base64'); do
    _jq() {
     echo ${row} | base64 --decode | jq -r ${1}
    }
    headRefName=$(_jq '.headRefName')
    echo "Merging $headRefName..."
    git merge origin/$headRefName --no-edit || { echo "Merge failed, aborting."; git merge --abort; exit 1; }
done

if [[ "$REPO_NAME" == "vibe-nvr-site" || "$REPO_NAME" == "VibeNVR-site" ]]; then
  sed -i -E "s/>v[0-9]+\.[0-9]+\.[0-9]+</>v$VER_NUM</" src/header.html
elif [[ "$REPO_NAME" == "vibenvr-telemetry-worker" ]]; then
  sed -i -E "s/>v[0-9]+\.[0-9]+\.[0-9]+</>v$VER_NUM</" src/dashboard.js
fi

git rm -rf .agents .wrangler .env .dev.vars 2>/dev/null || true
git add -A
git commit -m "v$VER_NUM: merge PRs and bump version"

git checkout $DEFAULT_BRANCH
git merge release/$NEW_VERSION --no-edit
git branch -d release/$NEW_VERSION
git push origin $DEFAULT_BRANCH

git tag "$NEW_VERSION"
git push origin $DEFAULT_BRANCH --tags

TODAY=$(date +%Y-%m-%d)
NOTES="## [$VER_NUM] - $TODAY

### Changed
- Merged open PRs.
"

gh release create "$NEW_VERSION" --title "$NEW_VERSION" --notes "$NOTES"

echo "Released $NEW_VERSION with $PR_COUNT PRs merged."
