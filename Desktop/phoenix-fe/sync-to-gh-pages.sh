#!/bin/bash
# Auto-sync main branch to gh-pages for GitHub Pages deployment

set -e

echo "🔄 Syncing main to gh-pages..."

# Save current branch
CURRENT_BRANCH=$(git branch --show-current)

# Stash any uncommitted changes
if [[ -n $(git status -s) ]]; then
    echo "💾 Stashing uncommitted changes..."
    git stash
    STASHED=1
fi

# Switch to gh-pages and merge main
echo "🔀 Merging main into gh-pages..."
git checkout gh-pages
git merge main --no-edit

# Push to gh-pages
echo "⬆️  Pushing to gh-pages..."
git push origin gh-pages

# Return to original branch
echo "↩️  Returning to $CURRENT_BRANCH..."
git checkout "$CURRENT_BRANCH"

# Restore stashed changes
if [[ $STASHED -eq 1 ]]; then
    echo "📥 Restoring stashed changes..."
    git stash pop
fi

echo "✅ Done! GitHub Pages will update in 30-60 seconds."
echo "🌐 Live site: https://pheonixoftesla.github.io/phoenix-fe/"
