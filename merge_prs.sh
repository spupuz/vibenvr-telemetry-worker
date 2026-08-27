#!/bin/bash
jq -c '.[]' /tmp/prs.json | while read i; do
  PR_NUM=$(echo $i | jq -r '.number')
  HEAD_REF=$(echo $i | jq -r '.headRefName')
  TITLE=$(echo $i | jq -r '.title')
  
  echo "=========================================="
  echo "Merging PR #$PR_NUM: $TITLE"
  
  git merge origin/$HEAD_REF --no-edit
  
  if [ $? -ne 0 ]; then
    echo "Conflict detected in PR #$PR_NUM!"
    git merge --abort
    echo "Aborted merge for PR #$PR_NUM."
  else
    echo "Successfully merged PR #$PR_NUM."
  fi
done
