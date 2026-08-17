#!/bin/bash
set -e

# Highest existing tag
LAST_TAG=$(git tag --sort=-v:refname | head -1 || true)
LAST_TAG=${LAST_TAG:-v1.0.0}

SUBJECT="feat(ui): dynamic version fetching in telemetry dashboard"

# Semantic bump
NEW_VERSION=$(node -e '
const [tag, subject] = process.argv.slice(1);
const [maj, minor, patch] = tag.replace(/^v/i, "").split(".").map(Number);
const m = subject.match(/^([a-z]+)(\([^)]*\))?(!)?:/);
const bump = m && m[3] ? "major" : (m && m[1] === "feat" ? "minor" : "patch");
console.log(bump === "major" ? `v${maj + 1}.0.0` : bump === "minor" ? `v${maj}.${minor + 1}.0` : `v${maj}.${minor}.${patch + 1}`);
' "$LAST_TAG" "$SUBJECT")

VER_NUM=${NEW_VERSION#v}
echo "Bumping from $LAST_TAG to $NEW_VERSION"

git add -A
git commit -m "$SUBJECT
- Auto-bump version to $NEW_VERSION"

git push origin $(git rev-parse --abbrev-ref HEAD)
git tag "$NEW_VERSION"
git push origin $(git rev-parse --abbrev-ref HEAD) --tags

TODAY=$(date +%Y-%m-%d)
NOTES="## [$VER_NUM] - $TODAY

### Changed
$(git log "$LAST_TAG"..HEAD --format='- %s' | sed 's/^- \([a-z]*\): \(.*\)/- **\1**: \2/')
"
gh release create "$NEW_VERSION" --title "$NEW_VERSION" --notes "$NOTES"
echo "Done for $(basename $PWD)"
