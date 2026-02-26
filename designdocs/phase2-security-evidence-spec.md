# Phase 2 Spec — Security Evidence + Enforcement Visibility

## Context
Phase 1/1.5 reduced setup friction and made MCP discovery demoable.
Phase 2 should emphasize Lakera differentiation: clear, repeatable proof of protection behavior in MCP tool flows.

## Primary Goal
Show, in-product, how Lakera handles risky MCP tool interactions (allow/flag/block) in a way SEs can narrate in customer demos.

## Scope

### 1) Tool Invocation Security Timeline (UI)
- Add a timeline/event panel for MCP tool interactions:
  - user prompt / trigger
  - tool selected
  - moderation decision
  - final action (allowed, redacted, blocked)
- Keep language demo-friendly (human readable, not only JSON).

### 2) Re-Validation at Use-Time
- Re-check tool metadata/signals at invocation time (not only at registration/discovery).
- If tool metadata looks suspicious, mark event with warning severity and visible reason.

### 3) Moderation Outcome Surfacing
- For each tool call, display:
  - status: pass / flagged / blocked
  - reason categories (when available)
  - enforcement action taken
- Surface outcome both in tool/event UI and chat preview path.

### 4) ON vs OFF Guided Comparison
- Add a guided scenario toggle:
  - Guard ON path
  - Guard OFF path
- Same scenario should show clearly different outcomes.

### 5) Scenario Pack (MVP subset)
- Include at least 2 built-in scenarios:
  - benign tool response (expected allow)
  - malicious/injection-like tool response (expected flag/block)

### 6) Demo UX Constraints
- Avoid overwhelming raw JSON by default.
- Keep raw payloads under optional “Debug” expansion.

## Out of Scope (for this phase)
- Full policy editor
- Multi-user auth/permissions
- Production-grade SIEM export

## Acceptance Criteria
1. SE can run one scenario and visibly show moderation decision + enforcement action.
2. Blocked/flagged outcomes are visible in main demo/chat preview (not hidden in backend logs).
3. Guard ON/OFF difference is demonstrable in under 2 minutes.
4. Raw JSON is optional; default view is human-readable.

## Delivery Plan

### Phase 2A (MVP)
- Build timeline/event UI
- Add pass/flag/block badges + reason display
- Add one malicious scenario + one benign scenario
- Add Guard ON/OFF comparison toggle

### Phase 2B (Polish)
- Add per-tool drilldown in timeline
- Improve copy/visual cues for demos
- Add optional debug payload view and export snippet

## Risk Notes
- Ensure no false claims of “100% protection”; present as detection/enforcement pipeline.
- Keep message text consistent with Lakera capability language.
