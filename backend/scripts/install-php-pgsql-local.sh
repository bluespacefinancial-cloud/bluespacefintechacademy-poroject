#!/usr/bin/env bash
# Install the PostgreSQL PHP extensions into backend/.php-ext without sudo.
#
# Downloads the Ubuntu packages that match the installed PHP version, extracts
# them under backend/.php-ext, and leaves the system untouched. `bin/artisan`
# then loads pdo_pgsql from that directory.
set -euo pipefail

ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
EXT_DIR="$ROOT/.php-ext"
WORK_DIR="$(mktemp -d)"
trap 'rm -rf "$WORK_DIR"' EXIT

PHP_VERSION="$(php -r 'echo PHP_MAJOR_VERSION.".".PHP_MINOR_VERSION;')"
if [[ "$PHP_VERSION" != "8.3" ]]; then
    echo "This helper targets PHP 8.3 (found $PHP_VERSION). Install php${PHP_VERSION}-pgsql instead." >&2
    exit 1
fi

cd "$WORK_DIR"
apt-get download php8.3-pgsql libpq5
mkdir -p "$EXT_DIR"

for package in ./*.deb; do
    dpkg-deb -x "$package" "$WORK_DIR/unpacked"
done

cp "$WORK_DIR/unpacked/usr/lib/php/20230831/"*.so "$EXT_DIR/" 2>/dev/null || true
mkdir -p "$EXT_DIR/lib"
cp "$WORK_DIR/unpacked/usr/lib/x86_64-linux-gnu/"libpq.so* "$EXT_DIR/lib/"

echo "Extracted pdo_pgsql into $EXT_DIR"
echo "Run commands with: $ROOT/bin/artisan <command>"
