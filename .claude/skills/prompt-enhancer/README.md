# Prompt Enhancer

A specialized skill for improving prompt reasoning and generating structured Mermaid flowcharts from conversations. It follows BRAID reasoning graph principles to create atomic, procedural, and deterministic reasoning structures.

## Reference

This skill is inspired by the research:
- [Chain of Thoughtlessness: An Analysis of Reasoning Artifacts in Large Language Models](https://arxiv.org/html/2512.15959v1)

## Features

- **Node Atomicity** - Ensures each reasoning step is atomic and concise.
- **Procedural Scaffolding** - Focuses on *how* to reason rather than *what* to say.
- **Deterministic Branching** - Uses labeled edges for explicit conditions.
- **Terminal Verification** - Includes check nodes and revision loops for quality assurance.

## Usage

After installation, use the skill to transform a vague prompt or a complex conversation into a structured reasoning graph.

```markdown
/prompt-enhancer [your prompt or conversation context]
```

## Structure

```
prompt-enhancer/
├── SKILL.md                 # Main skill definition
└── README.md                # Skill overview and references
```

## License

MIT
