#!/bin/bash

# Phoenix Color Theme Update Script
# Updates all cyan colors to exact Phoenix brand palette
# Primary: #00d9ff (was #00ffff)
# Secondary: #0096ff (was #0099ff or #0080ff)

echo "Updating Phoenix color scheme across all files..."

# Find all HTML, CSS, and JS files
find /Users/moderndavinci/Desktop/phoenix-fe \
  \( -name "*.html" -o -name "*.css" -o -name "*.js" \) \
  -not -path "*/node_modules/*" \
  -not -path "*/.git/*" \
  -type f \
  -exec sed -i '' \
    -e 's/#00ffff/#00d9ff/g' \
    -e 's/#0099ff/#0096ff/g' \
    -e 's/#0080ff/#0096ff/g' \
    -e 's/rgba(0, 255, 255/rgba(0, 217, 255/g' \
    -e 's/rgba(0,255,255/rgba(0, 217, 255/g' \
    -e 's/rgba(0, 99, 255/rgba(0, 150, 255/g' \
    -e 's/rgba(0,99,255/rgba(0, 150, 255/g' \
    -e 's/rgba(0, 80, 255/rgba(0, 150, 255/g' \
    -e 's/rgba(0,80,255/rgba(0, 150, 255/g' \
    {} \;

echo "✅ Color update complete!"
echo ""
echo "Updated colors:"
echo "  #00ffff → #00d9ff (primary cyan)"
echo "  #0099ff → #0096ff (secondary cyan)"
echo "  #0080ff → #0096ff (secondary cyan)"
echo "  rgba(0, 255, 255, X) → rgba(0, 217, 255, X)"
echo "  rgba(0, 99, 255, X) → rgba(0, 150, 255, X)"
echo "  rgba(0, 80, 255, X) → rgba(0, 150, 255, X)"
