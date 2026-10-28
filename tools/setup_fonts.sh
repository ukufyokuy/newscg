#!/usr/bin/env bash
# 下載 Noto Sans TC（OFL 授權，可商用）到固定位置，HTML 一律引用 /tmp/newscg-fonts/package/*.css
set -e
DEST=/tmp/newscg-fonts
[ -f "$DEST/package/900.css" ] && { echo "字型已就緒：$DEST/package"; exit 0; }
mkdir -p "$DEST" && cd "$DEST"
npm pack @fontsource/noto-sans-tc >/dev/null 2>&1
tar xzf fontsource-noto-sans-tc-*.tgz && rm -f fontsource-noto-sans-tc-*.tgz
echo "字型已就緒：$DEST/package"
