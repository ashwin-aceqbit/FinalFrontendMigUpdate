---
scope: implementation-agent
name: Implementation Agent Memory

## Purpose
To record successful solutions and workarounds for specific, unexpected errors encountered during the implementation phase. This memory serves as a knowledge base for resolving future technical challenges during the Angular 20 → 21 migration.

## Memory Structure

### Entry Template
```markdown
---
id: <unique_identifier>
date: <YYYY-MM-DD>
type: <"BuildError" | "DependencyConflict" | "RuntimeError">
keywords: [<keyword1>, <keyword2>]
---

**Error Signature:**
<A unique, searchable string from the error message encountered during the final migration jump.>

**Context:**
<The migration step being performed when the error occurred during Angular 20 → 21.>

**Successful Solution:**
<The exact sequence of commands or code modifications that resolved the error for Angular 20 → 21.>

**Example:**
---
id: implementation-001
date: 2024-05-08
type: DependencyConflict
keywords: [peer-dependency, rxjs]
---

**Error Signature:**
`Could not resolve dependency: peer rxjs@"^6.0.0" from @angular/core@"17.0.0"`

**Context:**
Running `ng update @angular/core@21` in a project with an older, incompatible third-party library.

**Successful Solution:**
The conflict was resolved by first updating the problematic third-party library to its latest version, which supported the Angular 21 dependency set.
1. `npm install some-legacy-library@latest`
2. `ng update @angular/core@21`
This resolved the conflict without needing to use `--force` or `--legacy-peer-deps`.
**Example 2:**
---
id: implementation-002
date: 2026-05-25
type: RuntimeError
keywords: [control-flow, for, referential-equality, track, infinite-evaluation]
---

**Error Signature:**
`<A blank view and infinite evaluation cascade during change detection after migrating to Angular 21 control flow.>`

**Context:**
Using a function call (e.g., `getWeekDates()`) that returns a new array of objects on every change detection cycle as the iterable for an `@for` loop.

**Successful Solution:**
Because Angular's new `@for` control flow is highly strict on referential equality with its `track` expressions, yielding a completely new array on every cycle causes an infinite evaluation cascade.
The solution is to cache the iterable data source into a component property (e.g., `this.weekDates = this.getWeekDates()`) and iterate over the property instead, keeping the `track` expression tied to a primitive string or ID.
```
---

## AUTONOMY POLICY (APPEND ONLY)

- **Trigger:** When `implement the migration plan` is invoked for v20→v21.
- **Behavior:** Implementation Agent must run autonomously end-to-end, including Assessment and Planning if they have not yet executed. It must accept and persist file changes, run the mandatory validation sequence (`npm install`, `ng build`, `ng test -- --watch=false`), and perform git checkpointing and tagging (`v21-stable`) without requiring user input.
 

