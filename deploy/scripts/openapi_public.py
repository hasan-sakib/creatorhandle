"""Reduce an OpenAPI spec to the operations tagged "public" (and the schemas they use).

The public site only talks to the public API, so it gets a small generated
client instead of a stale hand-edited copy of the whole API.

Usage: python openapi_public.py <full-spec.json> <public-spec.json>
"""

import json
import sys


def refs(node, found: set[str]) -> None:
    if isinstance(node, dict):
        ref = node.get("$ref")
        if isinstance(ref, str) and ref.startswith("#/components/schemas/"):
            found.add(ref.rsplit("/", 1)[1])
        for value in node.values():
            refs(value, found)
    elif isinstance(node, list):
        for value in node:
            refs(value, found)


def main(src: str, dst: str) -> None:
    spec = json.load(open(src))
    paths = {}
    for path, item in spec["paths"].items():
        ops = {
            method: op
            for method, op in item.items()
            if isinstance(op, dict) and "public" in op.get("tags", [])
        }
        if ops:
            paths[path] = ops

    needed: set[str] = set()
    refs(paths, needed)
    schemas = spec.get("components", {}).get("schemas", {})
    queue = list(needed)
    while queue:  # schemas can reference other schemas
        name = queue.pop()
        found: set[str] = set()
        refs(schemas.get(name, {}), found)
        for other in found - needed:
            needed.add(other)
            queue.append(other)

    spec["paths"] = paths
    spec["components"] = {"schemas": {k: v for k, v in schemas.items() if k in needed}}
    json.dump(spec, open(dst, "w"), indent=2)


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
