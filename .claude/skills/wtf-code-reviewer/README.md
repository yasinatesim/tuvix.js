# WTF/minute Code Reviewer

A strict senior architect reviewer for completed work. It goes beyond simple linting to check for functionality, architecture (Single Responsibility, Layering), complexity, maintainability, and domain model correctness. It holds code to high standards, ensuring it's readable and robust.

## Features

- **Functional Verification** - Ensures syntax correctness and requirement fulfillment.
- **Architecture Integrity** - Enforces Single Responsibility, layering, and dependency direction.
- **Data Modeling** - Checks for single source of truth and proper entity relationships.
- **Complexity Control** - Minimizes branching and nesting; ensures code is understandable on first read.
- **Maintainability** - Validates naming, error messages, and documentation.
- **Security Check** - Scans for vulnerabilities, bugs, and breaking changes.

## When to Use

Run this reviewer after:
- Feature completion
- Bug fixes
- Multi-file changes
- Refactoring

## Usage

Use the task tool to trigger the reviewer with specific implementation details.

```typescript
Task({
  subagent_type: 'WTF/minute Code Reviewer',
  description: 'Verify [your feature] implementation',
  prompt: `Verify the [feature]...`,
  readonly: true
})
```

## Structure

```
wtf-code-reviewer/
├── SKILL.md                 # Main skill definition
└── README.md                # Skill overview and standards
```

## License

MIT
