"""Windows compatibility shim for gltest 0.29.2 direct-mode stdin injection.

The bundled loader replaces fd 0 and immediately unlinks the open temp file;
Windows rejects that unlink. The contract/runtime behavior is unchanged.
"""

import os
from pathlib import Path

import pytest
from gltest.direct.loader import deploy_contract

_unlink = os.unlink


def _unlink_when_possible(path):
    try:
        _unlink(path)
    except PermissionError:
        pass


# gltest imports ``os`` inside its loader function, so patching the shared
# module keeps the compatibility shim scoped to this direct-test process.
os.unlink = _unlink_when_possible


@pytest.fixture
def direct_deploy(direct_vm):
    """Use the published GenVM bundle that contains the pinned contract SDK."""
    def _deploy(contract_path, *args, sdk_version="v0.2.16", **kwargs):
        path = Path(contract_path).resolve()
        return deploy_contract(path, direct_vm, *args, sdk_version=sdk_version, **kwargs)

    return _deploy
