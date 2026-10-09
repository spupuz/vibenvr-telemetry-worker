# OmniState — MANDATORY Persistent Memory Protocol

This project MUST use the OmniState MCP server (name: `omnistate`) for persistent, cross-project memory. These rules are NON-NEGOTIABLE at session start.

## AT SESSION START (Execute IMMEDIATELY on first user request)
1. Get absolute current working directory: `pwd` (resolve symlinks if needed).
2. Call `tools.omnistate.project_register({ path: "<absolute_cwd>" })`. Wait for result. Extract `project` name.
3. Call `tools.omnistate.session_start({ project: "<name>" })`. Wait for result.
4. READ and SUMMARIZE in MAX 3 bullets: `recent_memory`, `open_tasks`, and `recall` (if present). Output those 3 bullets BEFORE taking any other action.
5. Do NOT proceed with implementation until steps 1-4 are complete.

## DURING THE SESSION (MANDATORY)
- **Task discipline**: For EVERY significant activity, call `task_add(project, title, status="in_progress")` BEFORE starting work. Call `task_update(project, task_id, status="done")` IMMEDIATELY upon completion. Do NOT batch at end.
- **Avoid duplicates**: Call `task_list(project)` before creating a non-trivial task.
- **Shared knowledge**: Call `memory_remember` with `scope="shared"` ONLY for reusable decisions/preferences valid across ALL projects (conventional commits, tooling standards, global conventions).
- **Project knowledge**: Call `memory_remember` with `scope="project"` for project-specific notes, decisions, gotchas, fixes.
- **Reuse first**: Call `memory_search` (search across projects) before solving something that may exist already.
- **Traceability**: Prefer concise, distillable memory entries (summaries, not full dumps). Include relevant tags when useful.

## AT SESSION END / SNAPSHOT
- When work completes or user asks to save/close: call `session_snapshot(project, summary="<2-5 line distilled summary of accomplishments>")`.

## HARD RULES
- NEVER fabricate memory. Only report real tool results from OmniState.
- If `omnistate` MCP is UNREACHABLE: state this ONCE, do NOT block user work, and continue without memory.
- Project MUST be registered BEFORE using any project-scoped memory.
- These steps are MANDATORY for every new session in this project. Treat them as a precondition, not optional.
