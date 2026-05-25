---
name: Angular Migration Implementation
description: >
  Executes the migration plan by applying code and configuration changes in a controlled, step-by-step manner.
  This skill is responsible for all file modifications, dependency updates, and build validations.

dependencies:
  - `planning.skill.md`

inputs:
  - `plan/migration_plan.md`

tasks:
  - task: Execute tasks for the current migration phase.
    instructions:
      - Read the next task from `plan/migration_plan.md`.
      - Apply the specified code or configuration changes to the relevant files.
      - Use tools to perform automated refactoring where possible.
      - If the CLI presents an optional migration prompt, always choose the recommended/default option or the first option, then continue without user input.
      - If progress stalls, immediately record the blocker and the next recovery move in the log before taking the smallest viable recovery action.

  - task: Update dependencies.
    instructions:
      - Run `ng update` or `npm install` to update Angular and third-party packages as defined in the plan.
      - Use `--force` or `--legacy-peer-deps` only when explicitly instructed by the plan.
      - After the Angular 20 → 21 migration completes, run `git status`, create the commit, and push it before closing the workflow.

  - task: Validate each step.
    instructions:
      - After every significant change, run `ng build` to ensure the project still compiles.
      - If a build fails, attempt to fix the issue or trigger the rollback procedure.
      - Treat build warnings tied to the migration as cleanup items that must be resolved or explicitly recorded.

  - task: Detect and fix zone/change detection issues.
    instructions:
      - After applying code changes, scan for components using `setInterval()`, `setTimeout()`, direct event handlers, or other async callbacks that mutate component data.
      - If found, verify that the component has one of the following:
        1. `ChangeDetectorRef.markForCheck()` called after data mutations in the callback, OR
        2. Data mutations wrapped inside `this.ngZone.run(() => { ... })`, OR
        3. Mutations happening inside proper RxJS subscriptions (which are automatically managed by Angular)
      - If none of these patterns are present, the component is **broken post-migration** and must be fixed before committing.
      - Document the fix in the implementation log: "Fixed zone/change detection in [Component]" with the pattern used.
      - This is a **runtime defect** that won't be caught by compilation or basic unit tests; it only appears during actual user interaction with the component.

  - task: Prevent and fix Angular @for control flow referential equality hazards.
    instructions:
      - Scan for `@for` iterations introduced during the Angular 21 control flow migration.
      - Ensure the iterable data source is NOT a function call that yields new object arrays on every cycle (e.g., `getWeekDates()`), as this breaks referential equality in strict `track` expressions and causes infinite evaluation/blank views.
      - If found, refactor the application state to cache the iterable into a property (e.g., `this.weekDates = this.getWeekDates()`) and iterate over the property, keeping the `track` expression tied to a primitive string or ID.

  - task: Log all actions.

    - task: Execute the final migration plan.
      instructions:
        - Read `plan/migration_plan.md` to understand the final Angular 20 → 21 plan.
        - Execute the plan fully, respecting all phases and validation gates.
        - After all tasks complete, trigger the validation gates (build, test, lint) for the final jump.
        - If ALL gates pass: Create git checkpoint with commit message "chore: complete Angular 21 migration".
        - Run `git push origin main` to push the checkpoint immediately.
        - Verify git push succeeded before closing the workflow.
        - If any gate FAILS, halt and escalate with the specific failure and recovery options.
        - Log the final completion, gate results, and git checkpoint to `report/implementation_log.md`.

    - task: Log all actions.
    instructions:
      - Maintain a detailed log of every command run and file modified.
      - Record the output of all build and test commands.
      - Save the log to `report/implementation_log.md`.
      - Note any stalled step together with the exact next move so recovery never goes blank.
      - After a version jump completes, log the git status, commit, and push result before the next step starts.
    output: `report/implementation_log.md`
---

# Autonomous Execution Extension (Append Only)
- This skill must support a fully autonomous `implement the migration plan` invocation that:
  - Runs Assessment and Planning automatically if not already executed.
  - Applies and persists code changes to the workspace.
  - Runs `npm install`, `ng build --configuration=production`, and `ng test -- --watch=false`.
  - Creates a git checkpoint and pushes: `git add -A`, `git commit -m "chore(migration): complete Angular v21"`, `git push origin HEAD`, `git tag v21-stable`, `git push origin v21-stable`.
  - Resolves optional CLI prompts using the recommended/default option without asking the user.
  - Records all steps, outputs, and final commit/tag in `report/implementation_log.md`.
