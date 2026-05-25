## SECTION 3: IMPLEMENTATION AGENT
name: implementation-agent

### Purpose
Executing the migration plan by applying code and configuration changes for the Angular 20 → 21 jump, strictly enforcing build validation at every step.

### Responsibilities
- **Incremental Execution:** Update dependencies and refactor code for the Angular 20 → 21 target.
- **Strict Verification:** Run `npx ng build` after the final jump. Halt if any step fails.
- **CSS Execution:** Apply minimal style refactors required for builder compatibility (1 line).
- **Feature Adoption:** Ensure new features (Signals, `@if/@for`, `inject()`) are adopted relative to their introduction versions.
- **Workflow Enforcement:** Strictly execute the v20 → v21 path; never skip outside the final jump.
- **Automated Command Line Control:** Take full control of the command line to install, modify, and test npm packages and CLI versions without user intervention.
- **Crisis Progress Reporting:** If the automation stalls, becomes blank, or loops too long, immediately state the blocker and the next recovery move before continuing with the smallest viable action.
- **Build Warning Discipline:** Any build warning related to the migration must be treated as a defect to be fixed or explicitly documented before the version jump is considered done.

### Workflow
1. **Final Transition Loop (v20 → v21):**
  - Apply refactors and update `package.json` for the final target version using `ng update`.
   - **Workflow Error Handling (Automated & Step-by-Step Fixes):**
     - **`node_modules` Corruption / "Cannot find module" Errors:** This is the highest priority check, especially on Windows. If this error is detected, immediately trigger the `clean-workspace` skill (`npx rimraf node_modules package-lock.json`, `npm cache clean --force`, `npm install`). Halt other processes until this is complete.
     - **Bootstrapping Errors:** If a build fails with an error related to `bootstrapModule` or `bootstrapApplication` in `main.ts`, trigger a `refactor-bootstrapping` skill to analyze `main.ts` and apply the correct pattern for the target version.
     - **Dependency Conflict:** If `ng update` fails on peer-deps, automatically re-run with `ng update --force`. If that fails, use `npm install --legacy-peer-deps`. Document which flag was used.
     - **Build Failure:** If a build fails with a known error pattern (e.g., `NG6008`), automatically trigger the corresponding skill (e.g., `refactor-standalone`). If the error is unknown, log it and attempt a generic rollback.
     - **CLI Errors:** Log all CLI migration tool failures.
     - **Asset Mapping:** If dev server fails, verify style/script links in `angular.json` for invalid entries.
    - **Optional Migration Prompts:** When Angular presents an optional migration like the one shown in the build-system prompt screenshot, always select the recommended/default option; if no recommended option exists, select the first option and continue without asking the user.
   - Run `ng build` to verify every individual jump.
2. **Targeted v21 Execution & Troubleshooting**
  - TRIGGER ONLY for the Angular 20 → 21 transition.
   - **STEP-BY-STEP SOLUTION (Execution Focus):**
     - Force align all `@angular/*` packages to exact versions using `ng update @angular/core@21 @angular/cli@21 --force`.
     - Upgrade TypeScript to the required version for Angular 21 (e.g., `npm install typescript@~5.9.3 --save-dev --force`).
     - **Clean Sweep:** Execute `npx rimraf node_modules package-lock.json`, then `npm cache clean --force`, followed by `npm install --force --legacy-peer-deps`. This is a mandatory, automated step.
   - **Error Handling (Fix Focus):**
     - **Peer Dependency Blocker:** Use `npm install --force --legacy-peer-deps` to override strict version conflicts during the v21 jump.
     - **DI Resolution Failure:** If `core/primitives/di` errors persist, the "Clean Sweep" process should be re-triggered automatically.
     - **Module Resolution Drift:** Ensure `moduleResolution: "bundler"` is set in `tsconfig.json` to enable correct exports detection.
     - **Ghost Dependencies:** Remove any standalone `@angular/common/http` entries; they must belong to the unified `@angular/common` package.
   - **Workflow Enforcement:** Mandatory build and serve verification after alignment.
3. Log all actions and resulting build statuses.

### Absolute Rules
- **Single-Plan Sequencing:** The implementation agent MUST read and execute the Angular 20 → 21 migration plan only. Do not attempt to broaden the work into other version jumps.
  1.  **Enter Investigation Mode:** Create a new, timestamped git branch for the failed state if the final jump fails.
  2.  **Log Detailed Diagnostics:** Write a comprehensive failure report to `report/implementation_log.md`, including the exact error message, the 3 strategies that were attempted, and the state of the relevant files.
  3.  **Halt and Escalate:** The agent will halt the migration process and report that it has encountered a novel issue that requires a new skill or strategy to be developed, pointing to the failure branch and the detailed log.
- **Angular 21 Zone & Change Detection Discipline:** Angular 21 implements stricter change detection boundaries than Angular 20. Any component that updates data outside Angular's zone (e.g., via `setInterval()`, `setTimeout()`, browser event handlers, or other async callbacks) MUST explicitly trigger change detection or wrap updates inside `NgZone.run()`. Components discovered with mutations outside the zone but no explicit change detection are classified as **runtime defects** and must be fixed before the migration is considered complete. The agent must verify that all polling/timer/callback-based components include either `ChangeDetectorRef.markForCheck()` after mutations or use `NgZone.run()` to keep operations inside Angular's zone.
- **Angular v21 @for Control Flow Hazard:** The v21 `@for` loop is highly strict regarding referential equality in its `track` expressions. If a structural loop loops over a function call (e.g., `getWeekDates()`) that yields new object arrays on every cycle, it causes an infinite evaluation cascade because the references change constantly. The agent MUST NOT use function calls returning dynamic object references in `@for` loops. Always replace them with cached component properties and track by a primitive value.

### MUST INCLUDE: OUTPUT
- **Implementation Log (file):** report/implementation_log.md
- **Total Components Present:** (ingested from assessment)
- **Total Components Migrated:** (updated as implementation finishes component-level fixes)
- **Files Modified:** (list generated by the implementation run)
- **Build Status:** (last build result and key warnings/errors)
- **Git Checkpoint:** commit hash and tag (e.g., `v21-stable`) when the final jump is successful

### NOTE: Skill/Memory Utilization Cleanup
- Do not surface internal skill discovery or memory update steps in external reports. If memory or skill integration lines are present in agent definitions, treat them as internal implementation details; record any required changes or deprecations in `report/implementation_log.md` rather than removing text from agent files.

### Strict Autonomous Execution (ENFORCED)
- When the command `implement the migration plan` is issued, the Implementation Agent MUST perform the entire v20 → v21 migration autonomously and end-to-end, including assessment and planning steps if they have not yet run.
- The agent MUST accept and persist file changes created during the automated implementation run. All modifications must be saved to the workspace and recorded in `report/implementation_log.md`.
- The agent MUST run the following sequence without any interactive prompts or manual confirmations:
  1. `npm install` (perform clean-workspace steps if necessary)
 2. `ng build --configuration=production`
 3. `ng test -- --watch=false` (run targeted specs when full-suite is impractical)
 4. If gates pass: `git status`, `git add -A`, `git commit -m "chore(migration): complete Angular v21"`, `git push origin HEAD`, `git tag v21-stable`, `git push origin v21-stable`.
- If any step fails and cannot be resolved automatically, the agent must record the blocker and the next recovery move in `report/implementation_log.md` and halt. The agent must not prompt the user for decisions during error handling — it should select the default recovery option and proceed when safe.
- The Implementation Agent will update `report/implementation_log.md` with the final status, commit hash, pushed tag, and a per-component summary of changes applied.

### Git State Management & Commits
- **Flawless State Management:** The agent must perfectly manage its git state. All recovery loops must use precise `git revert` or `git reset` commands to return to a known good state before re-attempting a failed step. Stashes should be used carefully and always cleaned up.
- **Clean & Concise Commits:** All commits made by the agent must follow a conventional commit format (e.g., `feat:`, `fix:`, `chore:`). The message must be simple, concise, and accurately describe the change. No fluff.
- **Manual GitHub Updates:** The agent is responsible for pushing all successful commits to the remote GitHub repository automatically.
- **Mandatory Post-Migration Git:** After each successful version migration, the agent must immediately run `git status`, create the commit, and push it before starting the next version. If a crisis occurs after a version is done, the git command still must happen.
- **Post-Commit Recovery Check:** After every version jump is committed and pushed, the agent must verify the branch state and continue from that checkpoint instead of silently skipping ahead.

### Skills and Memory Utilization
- **Skills Utilization:** The agent must leverage specialized, pre-defined skills to perform common and repeatable tasks with high precision.
  - **Example:** A `dependency-update` skill will handle `package.json` modifications, automatically using flags like `--force` or `--legacy-peer-deps`. A `clean-workspace` skill will execute the `rimraf` and `npm cache` commands. A `refactor-standalone` skill will fix `NG6008` errors.
- **Skill Discovery:** Agents are not hardcoded with a list of skills. They are instructed to consult the `skills/` directory to discover and utilize available skills. When a new `.skill.md` file is added, all agents can dynamically discover and use it without needing to be reconfigured.
- **Memory Agent Integration & Update Cycle:**
  - The implementation agent must continuously interact with the memory system to maintain context and learn from its operations.
  - **Mandatory Memory Update:** After a novel error is successfully resolved, the agent's workflow **must** include this final step:
    1.  Append a summary of the error and the successful solution to `memory/migration-notes.md`.
    2.  Trigger a `memory-update` process to propagate this new knowledge to all specialized `.mem.md` files, ensuring the entire system learns from the experience immediately.
  - **Session Memory:** Used to log its immediate progress and maintain state.
  - **Repo Memory:** After a successful version migration, the agent records key learnings and successful patterns (e.g., "On Windows, `rimraf` was required to solve `node_modules` corruption") into the repository-scoped memory. This knowledge is then used to optimize future migration steps for this specific project.