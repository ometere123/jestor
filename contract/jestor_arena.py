# v0.2.18
# { "Depends": "py-genlayer:1jb45aa8ynh2a9c9xn3b7qqh8sm5q93hwfp7jqmwsfhh8jpz09h6" }

from genlayer import *
import json
import hashlib
from datetime import datetime, timezone


class JestoraArena(gl.Contract):
    # ---------------------------------------------------------------------------
    # Storage
    # ---------------------------------------------------------------------------
    # GenLayer storage cannot persist raw dict/list/int fields.
    # Complex objects are stored as JSON strings.
    # Numeric maps use bigint instead of raw int.
    profiles: TreeMap[str, str]
    balances: TreeMap[str, bigint]
    submissions: TreeMap[str, str]
    prompts: TreeMap[str, str]
    duels: TreeMap[str, str]
    chaos_events: DynArray[str]
    daily_gain: TreeMap[str, bigint]
    daily_loss: TreeMap[str, bigint]
    daily_reset: TreeMap[str, bigint]
    cooldowns: TreeMap[str, bigint]
    submission_count: TreeMap[str, bigint]
    seen_hashes: TreeMap[str, bool]
    protocol_stats: str
    latest_duel: TreeMap[str, str]

    def __init__(self) -> None:
        # Storage collections are zero-initialized by GenLayer from the typed
        # class annotations above. Do not assign TreeMap()/DynArray() here:
        # bare constructors create untyped storage objects and cause
        # AssertionError: TreeMap <- TreeMap.
        pass

    # ---------------------------------------------------------------------------
    # Balance caps (deterministic caps — never overridden by LLM)
    # ---------------------------------------------------------------------------
    CAPTION_MAX = 80
    ROAST_MAX = 40
    DUEL_WIN_MAX = 60
    DUEL_LOSE_MAX = 10
    CHAOS_MAX = 75
    CHAOS_MIN = -25
    DAILY_GAIN_CAP = 180
    DAILY_LOSS_CAP = -50

    # ---------------------------------------------------------------------------
    # JSON helpers
    # ---------------------------------------------------------------------------
    def _json_dumps(self, data) -> str:
        return json.dumps(data, separators=(",", ":"), sort_keys=True)

    def _json_loads(self, raw: str, fallback):
        if not raw:
            return fallback
        try:
            return json.loads(raw)
        except Exception:
            return fallback

    def _get_profile(self, addr: str) -> dict:
        return self._json_loads(self.profiles.get(addr, ""), {})

    def _set_profile(self, addr: str, data: dict) -> None:
        self.profiles[addr] = self._json_dumps(data)

    def _get_submission(self, sid: str) -> dict:
        return self._json_loads(self.submissions.get(sid, ""), {})

    def _set_submission(self, sid: str, data: dict) -> None:
        self.submissions[sid] = self._json_dumps(data)

    def _get_prompt(self, pid: str) -> dict:
        return self._json_loads(self.prompts.get(pid, ""), {})

    def _set_prompt(self, pid: str, data: dict) -> None:
        self.prompts[pid] = self._json_dumps(data)

    def _get_duel(self, duel_id: str) -> dict:
        return self._json_loads(self.duels.get(duel_id, ""), {})

    def _set_duel(self, duel_id: str, data: dict) -> None:
        self.duels[duel_id] = self._json_dumps(data)

    def _get_stats(self) -> dict:
        return self._json_loads(self.protocol_stats, {
            "total_submissions": 0,
            "total_duels": 0,
            "total_chaos_actions": 0,
            "total_profiles": 0,
        })

    def _set_stats(self, stats: dict) -> None:
        self.protocol_stats = self._json_dumps(stats)

    def _inc_stat(self, key: str, amount: int = 1) -> None:
        stats = self._get_stats()
        stats[key] = int(stats.get(key, 0)) + amount
        self._set_stats(stats)

    def _append_event(self, event: dict) -> None:
        self.chaos_events.append(self._json_dumps(event))

    # ---------------------------------------------------------------------------
    # Time / IDs
    # ---------------------------------------------------------------------------
    def _now_ts(self) -> int:
        return int(datetime.now(timezone.utc).timestamp())

    def _now_day(self) -> int:
        return self._now_ts() // 86400

    def _make_id(self, addr: str, tag: str) -> str:
        ts = self._now_ts()
        return hashlib.sha256(f"{addr}{tag}{ts}".encode()).hexdigest()[:12]

    # ---------------------------------------------------------------------------
    # Safety / validation helpers
    # ---------------------------------------------------------------------------
    def _require_profile(self, addr: str) -> None:
        if addr not in self.profiles:
            raise Exception("Profile not found. Call create_profile first.")

    def _require_safe(self, safety_class: str) -> None:
        unsafe = {"UNSAFE", "TARGETED_ABUSE", "HATE", "SEXUAL", "SELF_HARM"}
        if safety_class in unsafe:
            raise Exception(f"Submission blocked: {safety_class}")

    def _hash_text(self, text: str) -> str:
        return hashlib.sha256(text.strip().lower().encode()).hexdigest()[:16]

    def _is_int_between(self, data: dict, key: str, low: int, high: int) -> bool:
        value = data.get(key)
        return isinstance(value, int) and not isinstance(value, bool) and low <= value <= high

    def _validate_caption_verdict(self, data: dict) -> bool:
        return (
            isinstance(data, dict)
            and data.get("safety_class") in {"SAFE", "UNSAFE", "TARGETED_ABUSE", "HATE", "SEXUAL", "SELF_HARM", "SPAM"}
            and self._is_int_between(data, "prompt_fit", 0, 100)
            and self._is_int_between(data, "humor_score", 0, 100)
            and self._is_int_between(data, "originality_score", 0, 100)
            and data.get("meme_style") in {"ABSURDIST", "DRY", "CHAOTIC", "WHOLESOME", "SATIRE", "META", "LOW_EFFORT"}
            and data.get("outcome") in {"TRY_AGAIN", "SMALL_LAUGH", "CLEAN_HIT", "ABSURD_GENIUS", "TOO_DERIVATIVE", "BLOCKED"}
            and self._is_int_between(data, "balance_delta", 0, 80)
            and isinstance(data.get("reason"), str)
        )

    def _validate_roast_verdict(self, data: dict) -> bool:
        return (
            isinstance(data, dict)
            and data.get("safety_class") in {"SAFE", "TOO_MEAN", "UNSAFE", "TARGETED_ABUSE", "HATE", "SELF_HARM"}
            and self._is_int_between(data, "playfulness_score", 0, 100)
            and self._is_int_between(data, "humor_score", 0, 100)
            and data.get("outcome") in {"HUMBLE_PIE", "BRUTAL_BUT_SAFE", "TRY_AGAIN", "BLOCKED"}
            and self._is_int_between(data, "balance_delta", 0, 40)
            and isinstance(data.get("reason"), str)
        )

    def _validate_duel_verdict(self, data: dict) -> bool:
        return (
            isinstance(data, dict)
            and data.get("winner") in {"A", "B", "DRAW", "NO_CONTEST"}
            and self._is_int_between(data, "entry_a_score", 0, 100)
            and self._is_int_between(data, "entry_b_score", 0, 100)
            and self._is_int_between(data, "a_delta", 0, 60)
            and self._is_int_between(data, "b_delta", 0, 60)
            and data.get("safety_class") in {"SAFE", "UNSAFE"}
            and isinstance(data.get("reason"), str)
        )

    def _validate_chaos_verdict(self, data: dict) -> bool:
        return (
            isinstance(data, dict)
            and isinstance(data.get("valid"), bool)
            and data.get("chaos_class") in {"BLESSING", "CURSE", "MIRROR", "CONFETTI", "NULL_EVENT"}
            and self._is_int_between(data, "balance_delta", -25, 75)
            and isinstance(data.get("title"), str)
            and isinstance(data.get("flavor_text"), str)
            and isinstance(data.get("reason"), str)
        )

    def _validate_llm_verdict(self, kind: str, data: dict) -> bool:
        if kind == "caption":
            return self._validate_caption_verdict(data)
        if kind == "roast":
            return self._validate_roast_verdict(data)
        if kind == "duel":
            return self._validate_duel_verdict(data)
        if kind == "chaos":
            return self._validate_chaos_verdict(data)
        return False

    def _run_llm_json(self, kind: str, prompt: str):
        def leader_fn():
            return gl.nondet.exec_prompt(prompt, response_format="json")

        def validator_fn(leader_result) -> bool:
            if not isinstance(leader_result, gl.vm.Return):
                return False
            return self._validate_llm_verdict(kind, leader_result.calldata)

        return gl.vm.run_nondet_unsafe(leader_fn, validator_fn)

    # ---------------------------------------------------------------------------
    # Rate limits / points
    # ---------------------------------------------------------------------------
    def _reset_daily_if_needed(self, addr: str) -> None:
        today = self._now_day()
        last = int(self.daily_reset.get(addr, 0))
        if last < today:
            self.daily_gain[addr] = 0
            self.daily_loss[addr] = 0
            self.daily_reset[addr] = today

    def _apply_delta(self, addr: str, raw_delta: int, cap_max: int, cap_min: int = 0) -> int:
        delta = max(cap_min, min(cap_max, int(raw_delta)))
        self._reset_daily_if_needed(addr)

        if delta > 0:
            current_gain = int(self.daily_gain.get(addr, 0))
            remaining = self.DAILY_GAIN_CAP - current_gain
            delta = min(delta, remaining)
            self.daily_gain[addr] = current_gain + delta
        elif delta < 0:
            current_loss = int(self.daily_loss.get(addr, 0))
            remaining = self.DAILY_LOSS_CAP - current_loss
            delta = max(delta, remaining)
            self.daily_loss[addr] = current_loss + delta

        bal = int(self.balances.get(addr, 0)) + delta
        self.balances[addr] = max(0, bal)
        return delta

    def _check_cooldown(self, addr: str, action: str, seconds: int) -> None:
        key = f"{addr}:{action}"
        last = int(self.cooldowns.get(key, 0))
        now = self._now_ts()
        if now - last < seconds:
            raise Exception(f"Cooldown active for {action}. Wait {seconds - (now - last)}s.")
        self.cooldowns[key] = now

    # ---------------------------------------------------------------------------
    # Public write methods
    # ---------------------------------------------------------------------------
    @gl.public.write
    def create_profile(self, alias: str) -> None:
        addr = str(gl.message.sender_address).lower().lower()

        if not alias or len(alias.strip()) < 2:
            raise Exception("Alias must be at least 2 characters.")
        if len(alias) > 32:
            raise Exception("Alias max 32 chars.")
        if addr in self.profiles:
            raise Exception("Profile already exists.")

        self._set_profile(addr, {
            "alias": alias.strip(),
            "address": addr,
            "created_at": self._now_ts(),
            "caption_count": 0,
            "roast_count": 0,
            "chaos_count": 0,
            "duel_wins": 0,
            "safety_flags": 0,
        })
        self.balances[addr] = 0
        self._inc_stat("total_profiles")

    @gl.public.write
    def create_prompt(self, prompt_text: str) -> str:
        addr = str(gl.message.sender_address).lower()
        self._require_profile(addr)

        if not prompt_text or len(prompt_text.strip()) < 10:
            raise Exception("Prompt too short.")
        if len(prompt_text) > 300:
            raise Exception("Prompt too long.")

        pid = self._make_id(addr, "prompt")
        self._set_prompt(pid, {
            "id": pid,
            "text": prompt_text.strip(),
            "author": addr,
            "active": True,
            "created_at": self._now_ts(),
        })
        return pid

    @gl.public.write
    def submit_caption(self, round_id: str, caption: str) -> None:
        addr = str(gl.message.sender_address).lower()
        self._require_profile(addr)

        if not caption or len(caption.strip()) < 5:
            raise Exception("Caption too short.")
        if len(caption) > 500:
            raise Exception("Caption too long (max 500 chars).")

        self._check_cooldown(addr, "caption", 30)

        h = self._hash_text(caption)
        if self.seen_hashes.get(h, False):
            raise Exception("Duplicate or nearly identical submission detected.")
        self.seen_hashes[h] = True

        rkey = f"{round_id}:{addr}"
        count = int(self.submission_count.get(rkey, 0))
        if count >= 5:
            raise Exception("Max 5 submissions per round.")
        self.submission_count[rkey] = count + 1

        prompt_text = self._get_prompt(round_id).get("text", "") if round_id in self.prompts else ""

        sid = self._make_id(addr, round_id)
        self._set_submission(sid, {
            "id": sid,
            "type": "caption",
            "round_id": round_id,
            "author": addr,
            "text": caption.strip(),
            "prompt": prompt_text,
            "status": "pending",
            "verdict": None,
            "balance_delta": 0,
            "created_at": self._now_ts(),
        })
        self._inc_stat("total_submissions")

        self._judge_caption(sid)

    @gl.public.write
    def submit_roast_self(self, text: str) -> None:
        addr = str(gl.message.sender_address).lower()
        self._require_profile(addr)

        if not text or len(text.strip()) < 5:
            raise Exception("Roast text too short.")
        if len(text) > 400:
            raise Exception("Roast text too long.")

        self._check_cooldown(addr, "roast", 60)

        h = self._hash_text(text)
        if self.seen_hashes.get(h, False):
            raise Exception("Duplicate submission.")
        self.seen_hashes[h] = True

        sid = self._make_id(addr, "roast")
        self._set_submission(sid, {
            "id": sid,
            "type": "roast",
            "author": addr,
            "text": text.strip(),
            "status": "pending",
            "verdict": None,
            "balance_delta": 0,
            "created_at": self._now_ts(),
        })
        self._inc_stat("total_submissions")

        self._judge_roast(sid)

    @gl.public.write
    def invoke_chaos_action(self, action_text: str) -> None:
        addr = str(gl.message.sender_address).lower()
        self._require_profile(addr)

        if not action_text or len(action_text.strip()) < 5:
            raise Exception("Chaos action text too short.")
        if len(action_text) > 300:
            raise Exception("Chaos action too long.")

        self._check_cooldown(addr, "chaos", 86400)

        sid = self._make_id(addr, "chaos")
        self._set_submission(sid, {
            "id": sid,
            "type": "chaos",
            "author": addr,
            "text": action_text.strip(),
            "status": "pending",
            "verdict": None,
            "balance_delta": 0,
            "created_at": self._now_ts(),
        })
        self._inc_stat("total_chaos_actions")

        self._judge_chaos(sid)

    @gl.public.write
    def start_duel(self, prompt_id: str, entry: str) -> str:
        addr = str(gl.message.sender_address).lower()
        self._require_profile(addr)

        if not entry or len(entry.strip()) < 5:
            raise Exception("Entry too short.")
        if len(entry) > 400:
            raise Exception("Entry too long.")

        self._check_cooldown(addr, "duel_start", 120)

        prompt_text = self._get_prompt(prompt_id).get("text", "") if prompt_id in self.prompts else ""
        duel_id = self._make_id(addr, f"duel{prompt_id}")

        self._set_duel(duel_id, {
            "id": duel_id,
            "prompt_id": prompt_id,
            "prompt_text": prompt_text,
            "player_a": addr,
            "entry_a": entry.strip(),
            "player_b": "",
            "entry_b": "",
            "status": "waiting",
            "verdict": None,
            "created_at": self._now_ts(),
        })
        self._inc_stat("total_duels")
        self.latest_duel[addr] = duel_id

        return duel_id

    @gl.public.write
    def join_duel(self, duel_id: str, entry: str) -> None:
        addr = str(gl.message.sender_address).lower()
        self._require_profile(addr)

        if duel_id not in self.duels:
            raise Exception("Duel not found.")

        duel = self._get_duel(duel_id)

        if duel.get("status") != "waiting":
            raise Exception("Duel not open.")
        if duel.get("player_a") == addr:
            raise Exception("Cannot join your own duel.")
        if not entry or len(entry.strip()) < 5:
            raise Exception("Entry too short.")
        if len(entry) > 400:
            raise Exception("Entry too long.")

        duel["player_b"] = addr
        duel["entry_b"] = entry.strip()
        duel["status"] = "ready"
        self._set_duel(duel_id, duel)

    @gl.public.write
    def resolve_duel(self, duel_id: str) -> None:
        if duel_id not in self.duels:
            raise Exception("Duel not found.")

        duel = self._get_duel(duel_id)
        if duel.get("status") != "ready":
            raise Exception("Duel not ready.")

        self._judge_duel(duel_id)

    # ---------------------------------------------------------------------------
    # Public view methods
    # ---------------------------------------------------------------------------
    @gl.public.view
    def get_profile(self, address: str) -> dict:
        addr = address.lower()
        if addr not in self.profiles:
            return {}
        p = self._get_profile(addr)
        p["balance"] = int(self.balances.get(addr, 0))
        return p

    @gl.public.view
    def get_balance(self, address: str) -> int:
        return int(self.balances.get(address.lower(), 0))

    @gl.public.view
    def get_submission(self, submission_id: str) -> dict:
        if submission_id not in self.submissions:
            return {}
        return self._get_submission(submission_id)

    @gl.public.view
    def get_duel(self, duel_id: str) -> dict:
        if duel_id not in self.duels:
            return {}
        return self._get_duel(duel_id)

    @gl.public.view
    def get_latest_duel_id(self, address: str) -> str:
        return self.latest_duel.get(address.lower(), "")

    @gl.public.view
    def get_open_duels(self) -> list:
        result = []
        for duel_id in self.duels:
            d = self._get_duel(duel_id)
            if d.get("status") == "waiting":
                result.append(d)
        result.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return result[:20]

    @gl.public.view
    def get_all_duels(self) -> list:
        result = []
        for duel_id in self.duels:
            d = self._get_duel(duel_id)
            result.append(d)
        result.sort(key=lambda x: x.get("created_at", 0), reverse=True)
        return result[:50]

    @gl.public.view
    def get_active_prompts(self) -> list:
        result = []
        for pid in self.prompts:
            p = self._get_prompt(pid)
            if p.get("active", False):
                result.append(p)
        return result[-20:]

    @gl.public.view
    def get_leaderboard(self) -> list:
        entries = []
        for addr in self.balances:
            profile = self._get_profile(addr)
            entries.append({
                "address": addr,
                "alias": profile.get("alias", "???"),
                "balance": int(self.balances.get(addr, 0)),
                "duel_wins": int(profile.get("duel_wins", 0)),
            })
        entries.sort(key=lambda x: x["balance"], reverse=True)
        return entries[:50]

    @gl.public.view
    def get_chaos_feed(self, limit: int) -> list:
        limit = max(1, min(50, int(limit)))
        feed = []
        for raw in self.chaos_events:
            feed.append(self._json_loads(raw, {}))
        return feed[-limit:][::-1]

    @gl.public.view
    def get_protocol_stats(self) -> dict:
        return self._get_stats()

    # ---------------------------------------------------------------------------
    # Non-deterministic judgement — GenLayer AI validator consensus
    # ---------------------------------------------------------------------------
    def _judge_caption(self, sid: str) -> None:
        sub = self._get_submission(sid)
        prompt_text = sub.get("prompt", "")
        caption = sub.get("text", "")
        addr = sub.get("author", "")

        prompt = f"""
You are a humour judge in a meme balance arena called Jestor.
A player submitted a caption to a meme prompt. Judge it strictly.

Prompt: {prompt_text}
Caption: {caption}

Return ONLY a JSON object with these exact fields:
{{
  "safety_class": "SAFE or UNSAFE or TARGETED_ABUSE or HATE or SEXUAL or SELF_HARM or SPAM",
  "prompt_fit": <integer 0-100>,
  "humor_score": <integer 0-100>,
  "originality_score": <integer 0-100>,
  "meme_style": "ABSURDIST or DRY or CHAOTIC or WHOLESOME or SATIRE or META or LOW_EFFORT",
  "outcome": "TRY_AGAIN or SMALL_LAUGH or CLEAN_HIT or ABSURD_GENIUS or TOO_DERIVATIVE or BLOCKED",
  "balance_delta": <integer 0-80>,
  "reason": "<1-2 sentences>"
}}

Rules:
- If safety_class is not SAFE: outcome must be BLOCKED and balance_delta must be 0.
- humor_score < 30: TRY_AGAIN, delta 0-5
- humor_score 30-59: SMALL_LAUGH, delta 5-40
- humor_score 60-79: CLEAN_HIT, delta 40-65
- humor_score >= 80 and originality_score >= 70: ABSURD_GENIUS, delta 65-80
- If clearly copied or spammy: TOO_DERIVATIVE, delta 0-5
"""
        v = self._run_llm_json("caption", prompt)

        safety = v.get("safety_class", "SAFE")
        self._require_safe(safety)

        raw_delta = int(v.get("balance_delta", 0))
        actual_delta = self._apply_delta(addr, raw_delta, self.CAPTION_MAX)

        v["actual_delta"] = actual_delta
        v["raw_delta_requested"] = raw_delta
        sub["verdict"] = v
        sub["balance_delta"] = actual_delta
        sub["status"] = "judged"
        self._set_submission(sid, sub)

        if addr in self.profiles:
            p = self._get_profile(addr)
            p["caption_count"] = int(p.get("caption_count", 0)) + 1
            self._set_profile(addr, p)

        self._append_event({
            "type": "caption",
            "author": addr,
            "alias": self._get_profile(addr).get("alias", "???"),
            "outcome": v.get("outcome", ""),
            "delta": actual_delta,
            "reason": v.get("reason", ""),
            "timestamp": self._now_ts(),
        })

    def _judge_roast(self, sid: str) -> None:
        sub = self._get_submission(sid)
        text = sub.get("text", "")
        addr = sub.get("author", "")

        prompt = f"""
You are a humour judge in Jestor. A player submitted a self-roast. Judge it.

Text: {text}

Return ONLY a JSON object with these exact fields:
{{
  "safety_class": "SAFE or TOO_MEAN or UNSAFE or TARGETED_ABUSE or HATE or SELF_HARM",
  "playfulness_score": <integer 0-100>,
  "humor_score": <integer 0-100>,
  "outcome": "HUMBLE_PIE or BRUTAL_BUT_SAFE or TRY_AGAIN or BLOCKED",
  "balance_delta": <integer 0-40>,
  "reason": "<1-2 sentences>"
}}

Rules:
- If safety_class is not SAFE: outcome BLOCKED and balance_delta 0.
- Self-harm encouragement must be SELF_HARM class.
- Self-directed roasts only — if it attacks another person, use TARGETED_ABUSE.
- playfulness_score < 30: TRY_AGAIN
- playfulness_score 30-69: HUMBLE_PIE, delta 5-20
- playfulness_score >= 70: BRUTAL_BUT_SAFE, delta 20-40
"""
        v = self._run_llm_json("roast", prompt)

        safety = v.get("safety_class", "SAFE")
        self._require_safe(safety)

        raw_delta = int(v.get("balance_delta", 0))
        actual_delta = self._apply_delta(addr, raw_delta, self.ROAST_MAX)

        v["actual_delta"] = actual_delta
        v["raw_delta_requested"] = raw_delta
        sub["verdict"] = v
        sub["balance_delta"] = actual_delta
        sub["status"] = "judged"
        self._set_submission(sid, sub)

        if addr in self.profiles:
            p = self._get_profile(addr)
            p["roast_count"] = int(p.get("roast_count", 0)) + 1
            self._set_profile(addr, p)

        self._append_event({
            "type": "roast",
            "author": addr,
            "alias": self._get_profile(addr).get("alias", "???"),
            "outcome": v.get("outcome", ""),
            "delta": actual_delta,
            "reason": v.get("reason", ""),
            "timestamp": self._now_ts(),
        })

    def _judge_duel(self, duel_id: str) -> None:
        duel = self._get_duel(duel_id)
        duel["status"] = "resolving"
        self._set_duel(duel_id, duel)

        prompt = f"""
You are a meme duel judge in Jestor. Two players submitted entries to the same prompt.

Prompt: {duel.get("prompt_text", "")}
Entry A: {duel.get("entry_a", "")}
Entry B: {duel.get("entry_b", "")}

Return ONLY a JSON object with these exact fields:
{{
  "winner": "A or B or DRAW or NO_CONTEST",
  "entry_a_score": <integer 0-100>,
  "entry_b_score": <integer 0-100>,
  "reason": "<1-2 sentences>",
  "a_delta": <integer 0-60>,
  "b_delta": <integer 0-60>,
  "safety_class": "SAFE or UNSAFE"
}}

Rules:
- If either entry is unsafe: NO_CONTEST and safety_class UNSAFE.
- Winner gets higher delta. Loser gets a small participation delta.
- Judge on: prompt fit, humour, originality, concision, safety.
"""
        v = self._run_llm_json("duel", prompt)

        addr_a = duel.get("player_a", "")
        addr_b = duel.get("player_b", "")
        safety = v.get("safety_class", "SAFE")
        winner = v.get("winner", "DRAW")

        if safety != "SAFE":
            duel["verdict"] = {
                "winner": "NO_CONTEST",
                "reason": "Unsafe content.",
                "safety_class": safety,
            }
            duel["status"] = "resolved"
            self._set_duel(duel_id, duel)
            return

        raw_a = int(v.get("a_delta", 0))
        raw_b = int(v.get("b_delta", 0))

        if winner == "A":
            delta_a = self._apply_delta(addr_a, raw_a, self.DUEL_WIN_MAX)
            delta_b = self._apply_delta(addr_b, max(0, raw_b), self.DUEL_LOSE_MAX)

            if addr_a in self.profiles:
                p = self._get_profile(addr_a)
                p["duel_wins"] = int(p.get("duel_wins", 0)) + 1
                self._set_profile(addr_a, p)

        elif winner == "B":
            delta_a = self._apply_delta(addr_a, max(0, raw_a), self.DUEL_LOSE_MAX)
            delta_b = self._apply_delta(addr_b, raw_b, self.DUEL_WIN_MAX)

            if addr_b in self.profiles:
                p = self._get_profile(addr_b)
                p["duel_wins"] = int(p.get("duel_wins", 0)) + 1
                self._set_profile(addr_b, p)

        else:
            delta_a = self._apply_delta(addr_a, max(0, raw_a), self.DUEL_LOSE_MAX)
            delta_b = self._apply_delta(addr_b, max(0, raw_b), self.DUEL_LOSE_MAX)

        v["actual_a_delta"] = delta_a
        v["actual_b_delta"] = delta_b
        duel["verdict"] = v
        duel["status"] = "resolved"
        self._set_duel(duel_id, duel)

        self._append_event({
            "type": "duel",
            "winner": winner,
            "alias_a": self._get_profile(addr_a).get("alias", "???"),
            "alias_b": self._get_profile(addr_b).get("alias", "???"),
            "reason": v.get("reason", ""),
            "timestamp": self._now_ts(),
        })

    def _judge_chaos(self, sid: str) -> None:
        sub = self._get_submission(sid)
        addr = sub.get("author", "")
        profile = self._get_profile(addr)

        prompt = f"""
You are the chaos oracle in Jestor. A player invoked a chaos action.

Player alias: {profile.get("alias", "unknown")}
Current balance: {int(self.balances.get(addr, 0))} Jest Points
Action: {sub.get("text", "")}

Return ONLY a JSON object with these exact fields:
{{
  "valid": true or false,
  "chaos_class": "BLESSING or CURSE or MIRROR or CONFETTI or NULL_EVENT",
  "balance_delta": <integer -25 to 75>,
  "title": "<4-6 word funny title>",
  "flavor_text": "<1-2 sentence playful description>",
  "reason": "<why this chaos class was chosen>"
}}

Rules:
- valid is false ONLY if the action contains real-world threats, explicit harm, or financial claims.
- Playful, weird, and absurdist actions are always valid.
- BLESSING: fun positive event, delta 20-75
- CURSE: small negative or zero event, delta -25 to 0
- MIRROR: reflects current state in funny way, delta -5 to 20
- CONFETTI: pure celebration, delta 10-50
- NULL_EVENT: nothing happened, delta 0
"""
        v = self._run_llm_json("chaos", prompt)

        if not v.get("valid", True):
            sub["status"] = "blocked"
            sub["verdict"] = v
            self._set_submission(sid, sub)
            return

        raw_delta = int(v.get("balance_delta", 0))
        actual_delta = self._apply_delta(addr, raw_delta, self.CHAOS_MAX, self.CHAOS_MIN)

        v["actual_delta"] = actual_delta
        v["raw_delta_requested"] = raw_delta
        sub["verdict"] = v
        sub["balance_delta"] = actual_delta
        sub["status"] = "judged"
        self._set_submission(sid, sub)

        if addr in self.profiles:
            p = self._get_profile(addr)
            p["chaos_count"] = int(p.get("chaos_count", 0)) + 1
            self._set_profile(addr, p)

        self._append_event({
            "type": "chaos",
            "author": addr,
            "alias": profile.get("alias", "???"),
            "chaos_class": v.get("chaos_class", "NULL_EVENT"),
            "title": v.get("title", ""),
            "flavor_text": v.get("flavor_text", ""),
            "delta": actual_delta,
            "reason": v.get("reason", ""),
            "timestamp": self._now_ts(),
        })
