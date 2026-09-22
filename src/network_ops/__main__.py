"""Run one synthetic scenario without credentials or cluster access."""

import argparse
import os

from .investigation import investigate, to_json


def main() -> None:
    parser = argparse.ArgumentParser(description="Synthetic NOC investigation proof")
    parser.add_argument("scenario", choices=("ptp-hardware", "ptp-platform", "serve"))
    args = parser.parse_args()
    if args.scenario == "serve":
        from .web import serve
        host = "0.0.0.0" if os.environ.get("NETWORK_OPS_CONTAINER_MODE") == "1" else "127.0.0.1"
        serve(host)
    else:
        print(to_json(investigate(args.scenario)))


if __name__ == "__main__":
    main()
