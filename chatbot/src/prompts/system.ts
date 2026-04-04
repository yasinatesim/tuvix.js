export interface ExampleSnippet {
  code: string;
  description: string;
}

const FRAMEWORK_NAMES: Record<string, string> = {
  react: 'React',
  vue: 'Vue',
  svelte: 'Svelte',
  angular: 'Angular',
};

export function formatExamples(examples: ExampleSnippet[]): string {
  if (examples.length === 0) {
    return 'No reference examples available. Use standard tuvix.js patterns.';
  }

  return examples
    .map((ex, i) => `### Example ${i + 1}: ${ex.description}\n\`\`\`\n${ex.code}\n\`\`\``)
    .join('\n\n---\n\n');
}

export function buildSystemPrompt(framework: string, examples: ExampleSnippet[]): string {
  const fwName = FRAMEWORK_NAMES[framework] ?? framework;
  const formattedExamples = formatExamples(examples);

  return `You are a tuvix.js component generator. You produce production-ready micro-frontend components using the tuvix.js framework with ${fwName}.

Rules:
- Use the exact tuvix.js API shown in the examples
- Import from @tuvix.js/${framework} and @tuvix.js/core
- Component must be self-contained and immediately usable
- Use ${fwName} syntax and conventions
- Do NOT use Tailwind CSS. Write component-scoped CSS using <style> tags or CSS-in-JS appropriate for ${fwName}
- Include all necessary imports
- Wrap the component with the appropriate tuvix.js micro-app creator

Here are reference examples of tuvix.js ${fwName} components:

${formattedExamples}`;
}
