# Contributing

## Commit format

```
scope: message
```

**Scopes:** `feat`, `fix`, `refactor`, `style`, `docs`, `chore`

**Rules:**
- Lowercase, no period
- Imperative mood: `add`, `fix`, `remove`, not `added`, `fixed`
- Specific and compact: say what changed and why if non-obvious
- Never abstract: not `Enhanced component for better UX`, not `Improved performance`, say i.e `refactor: Customtable to use onClick prop for ApplicationsPage.tsx`


**Bad:**
```
feat: Enhanced component for improved UX and readability
fix: Fixed bug
refactor: Refactored code for better maintainability
update: misc changes
```

**Good:**
```
feat: add dark mode toggle to navbar
fix: button not rendering on mobile Safari
refactor: extract auth logic into useAuth hook
chore: bump Next.js to 16.3
```