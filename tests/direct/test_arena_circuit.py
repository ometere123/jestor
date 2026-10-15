import hashlib
import json
import time

import pytest


CONTRACT = "contract/jestor_arena.py"


def commit(prompt_id: str, address: bytes, entry: str, salt: str) -> str:
    raw = f"JESTOR-DUEL-V1|{prompt_id}|0x{address.hex()}|{salt}|{entry.strip()}"
    return hashlib.sha256(raw.encode()).hexdigest()


def mock_prompt(vm):
    vm.mock_llm(
        r"Moderate a player-created meme prompt.*",
        json.dumps({"allowed": True, "safety_class": "SAFE", "originality_score": 90, "duplicate": False, "reason": "Fresh game prompt."}),
    )


def test_profile_prompt_bounds_and_invalid_prompt_reference(direct_vm, direct_deploy, direct_alice):
    arena = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    arena.create_profile("alice")
    mock_prompt(direct_vm)
    prompt_id = arena.create_prompt("A validator walks into a group chat and refuses to agree.")
    assert isinstance(prompt_id, str) and prompt_id
    with direct_vm.expect_revert("Prompt not found"):
        arena.start_duel("not-a-prompt", "0" * 64)


def test_sealed_duel_commitment_identity_binding_and_replay_protection(direct_vm, direct_deploy, direct_alice, direct_bob):
    arena = direct_deploy(CONTRACT)
    direct_vm.sender = direct_alice
    arena.create_profile("alice")
    direct_vm.sender = direct_bob
    arena.create_profile("bob")
    mock_prompt(direct_vm)
    direct_vm.sender = direct_alice
    prompt_id = arena.create_prompt("A block refuses to finalize until it hears a good joke.")
    entry_a, salt_a = "A deterministic joke about pending blocks", "salt-alice-001"
    duel_id = arena.start_duel(prompt_id, commit(prompt_id, direct_alice, entry_a, salt_a))
    direct_vm.sender = direct_bob
    entry_b, salt_b = "A validator asks the block to try again", "salt-bob-001"
    arena.join_duel(duel_id, commit(prompt_id, direct_bob, entry_b, salt_b))
    with direct_vm.expect_revert("Invalid or repeated reveal"):
        arena.reveal_duel_entry(duel_id, entry_a, salt_a)
    direct_vm.sender = direct_alice
    arena.reveal_duel_entry(duel_id, entry_a, salt_a)
    direct_vm.sender = direct_bob
    arena.reveal_duel_entry(duel_id, entry_b, salt_b)
    duel = arena.get_duel(duel_id)
    assert duel["status"] == "ready"
    assert duel["entry_a"] == entry_a and duel["entry_b"] == entry_b
    with direct_vm.expect_revert("Invalid or repeated reveal"):
        arena.reveal_duel_entry(duel_id, entry_b, salt_b)


def test_bounded_views_and_permissionless_tournament_state_machine(direct_vm, direct_deploy, direct_accounts):
    arena = direct_deploy(CONTRACT)
    for i, account in enumerate(direct_accounts[:4]):
        direct_vm.sender = account
        arena.create_profile(f"p{i}")
    direct_vm.sender = direct_accounts[0]
    mock_prompt(direct_vm)
    prompt_id = arena.create_prompt("A meme becomes the chair of a validator committee.")
    tournament_id = arena.create_tournament(prompt_id, int(time.time()) + 120)
    for i, account in enumerate(direct_accounts[:4]):
        direct_vm.sender = account
        arena.join_tournament(tournament_id, f"unique circuit entry from player {i}")
    tournament = arena.get_tournament(tournament_id)
    assert len(tournament["players"]) == 4
    assert arena.get_open_tournaments()[0]["id"] == tournament_id
