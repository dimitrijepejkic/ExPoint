"""Refresh cache-busting ?v= tags for CSS/JS links in all HTML pages.

Run from the project folder after changing css/style.css or any js/*.js file:

    python tools/update-versions.py

Each tag is the first 8 characters of the file's SHA-256 (line endings
normalised), so it changes only when the file content changes. Browsers then
download the new file instead of using an old cached copy.
"""
import glob
import hashlib
import io
import os
import re

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
ASSETS = ["css/style.css", "js/main.js", "js/editor.js"]


def content_hash(path):
    with open(os.path.join(ROOT, path), "rb") as f:
        data = f.read().replace(b"\r\n", b"\n")
    return hashlib.sha256(data).hexdigest()[:8]


def main():
    versions = {a: content_hash(a) for a in ASSETS if os.path.exists(os.path.join(ROOT, a))}
    for page in sorted(glob.glob(os.path.join(ROOT, "*.html"))):
        with io.open(page, encoding="utf-8", newline="") as f:
            text = f.read()
        updated = text
        for asset, ver in versions.items():
            pattern = r'((?:href|src)="/?' + re.escape(asset) + r')(\?v=[0-9a-f]+)?"'
            updated = re.sub(pattern, r"\1?v=" + ver + '"', updated)
        if updated != text:
            with io.open(page, "w", encoding="utf-8", newline="") as f:
                f.write(updated)
            print("updated", os.path.basename(page))
    for asset, ver in versions.items():
        print(f"{asset}: v={ver}")


if __name__ == "__main__":
    main()
