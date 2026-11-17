#!/usr/bin/env python3
"""Preview the site locally exactly as it is published.

Fills the pages with build_content.py, serves the repository at
http://localhost:8000/ and, on Ctrl+C, restores the committed state
(build_content.py --clean), so the generated markup never gets committed.

After editing data/*.json, a template or build_content.py, stop and run it
again. Changes to CSS (css/*.css, joined again on every request of
css/styles.css) and JS only need a page reload.

Usage:
    python3 scripts/preview.py          # http://localhost:8000/
    python3 scripts/preview.py 8080     # another port
"""

from __future__ import annotations

import functools
import http.server
import signal
import subprocess
import sys
from pathlib import Path

from build_content import write_stylesheet

ROOT = Path(__file__).resolve().parent.parent
BUILD = [sys.executable, str(ROOT / "scripts" / "build_content.py")]


class PreviewHandler(http.server.SimpleHTTPRequestHandler):
    """Static server that joins css/*.css again whenever css/styles.css is requested,
    so a page reload shows CSS changes without restarting the preview."""

    def do_GET(self):
        if self.path.split("?")[0] == "/css/styles.css":
            write_stylesheet(clean=False)
        super().do_GET()

    def end_headers(self):
        # A development server: always fetch the latest version of every file.
        self.send_header("Cache-Control", "no-store")
        super().end_headers()


def main() -> int:
    """Build, serve until Ctrl+C, then restore the committed files."""
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 8000
    # Restore on Ctrl+C and also when the process is terminated (closing the terminal, kill).
    for sig in (signal.SIGINT, signal.SIGTERM, signal.SIGHUP):
        signal.signal(sig, signal.default_int_handler)
    subprocess.run(BUILD, check=True)
    try:
        handler = functools.partial(PreviewHandler, directory=str(ROOT))
        with http.server.ThreadingHTTPServer(("127.0.0.1", port), handler) as server:
            print(f"Serving http://localhost:{port}/  (Ctrl+C to stop and restore the committed files)")
            server.serve_forever()
    except KeyboardInterrupt:
        pass
    finally:
        subprocess.run(BUILD + ["--clean"], check=True)
    return 0


if __name__ == "__main__":
    sys.exit(main())
