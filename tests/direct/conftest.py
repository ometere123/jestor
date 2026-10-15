"""Windows compatibility shim for gltest 0.29.2 direct-mode stdin injection.

The bundled loader replaces fd 0 and immediately unlinks the open temp file;
Windows rejects that unlink. The contract/runtime behavior is unchanged.
"""

import os

_unlink = os.unlink


def _unlink_when_possible(path):
    try:
        _unlink(path)
    except PermissionError:
        pass


# gltest imports ``os`` inside its loader function, so patching the shared
# module keeps the compatibility shim scoped to this direct-test process.
os.unlink = _unlink_when_possible
