# Angular 20 → 21 Migration Notes

This document records the issues and solutions encountered during the Angular 20 → 21 migration process.

## Key Issues

### 1. Inconsistent Bootstrapping

- **Problem:** During the Angular 20 → 21 migration, the application failed to bootstrap due to changes in the bootstrapping API. Specifically, the `applicationProviders` property was not recognized in `platformBrowserDynamic().bootstrapModule()`.
- **Solution:** The `bootstrapModule` call in `src/main.ts` was simplified to `platformBrowserDynamic().bootstrapModule(AppModule)`, removing the unsupported options. This resolved the bootstrapping error.

### 2. Corrupted `node_modules` Directory

- **Problem:** The `node_modules` directory became corrupted, leading to "Cannot find module" errors when running `ng serve` during the Angular 20 → 21 migration. Attempts to remove the directory using `rm -r -force` failed due to file access errors on Windows.
- **Solution:** The `rimraf` package was used to reliably delete the `node_modules` directory and `package-lock.json`. The command `npx rimraf node_modules package-lock.json` was successful. After that, `npm cache clean --force` and `npm install` were run to ensure a clean installation of dependencies.

### 3. @for Control Flow Referential Equality Hazard

- **Problem:** Angular's new `@for` control flow (introduced in v17, heavily used in v21) is highly strict on referential equality with its `track` expressions. In some components, a function like `getWeekDates()` was creating and yielding a completely new array of `Date` objects on every single change detection cycle. Angular was stuck continually destroying and attempting to recreate every single block, creating an infinite evaluation cascade and leaving the view totally blank.
- **Solution:** The iterable data source must be cached into a component property (e.g., `this.weekDates = this.getWeekDates()`) instead of being evaluated directly in the template. The `@for` loop should iterate over this cached property, keeping the `track` expression tied to a primitive string or ID.
