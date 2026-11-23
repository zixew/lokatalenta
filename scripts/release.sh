#!/usr/bin/env bash
set -euo pipefail

# LokaTalenta Semantic Versioning & Changelog CLI
# Usage:
#   ./scripts/release.sh <patch|minor|major> "<deskripsi perubahan>"

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
CLIENT_DIR="$ROOT_DIR/client"
CHANGELOG_FILE="$ROOT_DIR/CHANGELOG.md"

BUMP_TYPE="${1:-}"
DESCRIPTION="${2:-}"

if [[ "$BUMP_TYPE" != "patch" && "$BUMP_TYPE" != "minor" && "$BUMP_TYPE" != "major" ]]; then
  echo "Error: Tipe versi harus salah satu dari: patch | minor | major"
  echo "Usage: $0 <patch|minor|major> \"<deskripsi perubahan>\""
  exit 1
fi

if [[ -z "${DESCRIPTION// /}" ]]; then
  echo "Error: Deskripsi perubahan WAJIB diisi agar terdokumentasi di CHANGELOG.md."
  echo "Usage: $0 $BUMP_TYPE \"<deskripsi perubahan>\""
  exit 1
fi

cd "$CLIENT_DIR"
echo "==> [1/4] Menjalankan lint, unit test & build sebelum rilis..."
npm run lint
npm test
npm run build

echo "==> [2/4] Menaikkan versi ($BUMP_TYPE) di client/package.json..."
NEW_VERSION="$(npm version "$BUMP_TYPE" --no-git-tag-version | tr -d 'v')"
RELEASE_DATE="$(date +%Y-%m-%d)"

SECTION_LABEL="Patch"
if [[ "$BUMP_TYPE" == "minor" ]]; then
  SECTION_LABEL="Minor"
elif [[ "$BUMP_TYPE" == "major" ]]; then
  SECTION_LABEL="Major"
fi

echo "==> [3/4] Menambahkan entri v$NEW_VERSION ke CHANGELOG.md..."
NEW_VERSION="$NEW_VERSION" \
RELEASE_DATE="$RELEASE_DATE" \
SECTION_LABEL="$SECTION_LABEL" \
DESCRIPTION="$DESCRIPTION" \
CHANGELOG_FILE="$CHANGELOG_FILE" \
node -e '
const fs = require("fs");
const file = process.env.CHANGELOG_FILE;
const content = fs.readFileSync(file, "utf8");
const entry = `## [${process.env.NEW_VERSION}] - ${process.env.RELEASE_DATE}\n\n### ${process.env.SECTION_LABEL}\n- ${process.env.DESCRIPTION}\n\n---\n\n`;
const marker = "---\n\n## [";
const idx = content.indexOf(marker);
if (idx !== -1) {
  const updated = content.slice(0, idx + 5) + entry + content.slice(idx + 5);
  fs.writeFileSync(file, updated, "utf8");
} else {
  fs.appendFileSync(file, "\n" + entry, "utf8");
}
'

echo "==> [4/4] Membuat commit & Git Tag v$NEW_VERSION..."
cd "$ROOT_DIR"
git add client/package.json CHANGELOG.md
git commit -m "chore(release): v$NEW_VERSION - $DESCRIPTION"
git tag -a "v$NEW_VERSION" -m "Release v$NEW_VERSION: $DESCRIPTION"

echo "Selesai! Versi baru: v$NEW_VERSION (tag v$NEW_VERSION siap di-push beserta branch)."
