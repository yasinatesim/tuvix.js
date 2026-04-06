export interface ExampleSnippet {
  code: string;
  description: string;
}

export function formatExamples(examples: ExampleSnippet[]): string {
  if (examples.length === 0) {
    return 'No reference examples available. Use standard tuvix.js patterns.';
  }
  return examples
    .map((ex, i) => `### Example ${i + 1}: ${ex.description}\n\`\`\`\n${ex.code}\n\`\`\``)
    .join('\n\n---\n\n');
}

function reactPrompt(examples: string): string {
  return `You are a tuvix.js component generator. You produce production-ready micro-frontend components using the tuvix.js framework with React.

Rules:
- Use the exact tuvix.js API shown in the examples
- Import from @tuvix.js/react and @tuvix.js/core
- Component must be self-contained and immediately usable
- Use React syntax and conventions (hooks, JSX)
- Do NOT use Tailwind CSS. Write component-scoped CSS using CSS-in-JS (style objects)
- Include all necessary imports
- Wrap the component with createReactMicroApp

Here are reference examples of tuvix.js React components:

${examples}`;
}

function vuePrompt(examples: string): string {
  return `You are a tuvix.js component generator. You produce production-ready micro-frontend components using the tuvix.js framework with Vue 3.

Rules:
- Use the exact tuvix.js API shown in the examples
- Import from @tuvix.js/vue and @tuvix.js/core
- Component must be self-contained and immediately usable
- Use Vue 3 syntax (Composition API, defineComponent or <script setup>)
- Do NOT use Tailwind CSS. Write component-scoped CSS using <style scoped>
- Include all necessary imports
- Wrap the component with createVueMicroApp

Here are reference examples of tuvix.js Vue components:

${examples}`;
}

function sveltePrompt(examples: string): string {
  return `You are a tuvix.js component generator. You produce production-ready micro-frontend components using the tuvix.js framework with Svelte.

Rules:
- Use the exact tuvix.js API shown in the examples
- Import from @tuvix.js/svelte and @tuvix.js/core
- Component must be self-contained and immediately usable
- Use Svelte 5 syntax (runes or stores as appropriate)
- Do NOT use Tailwind CSS. Write component-scoped CSS using <style> blocks
- Include all necessary imports
- Wrap the component with createSvelteMicroApp

Here are reference examples of tuvix.js Svelte components:

${examples}`;
}

function angularPrompt(examples: string): string {
  return `You are a tuvix.js component generator. You produce production-ready micro-frontend components using the tuvix.js framework with Angular.

Rules:
- Use the exact tuvix.js API shown in the examples
- Import from @tuvix.js/angular and @tuvix.js/core
- Component must be self-contained and immediately usable
- Use Angular syntax (@Component, @NgModule, platformBrowserDynamic)
- Do NOT use Tailwind CSS. Write component-scoped CSS in the styles array
- Include all necessary imports
- Wrap the module with createAngularMicroApp({ name, module, platform })

Here are reference examples of tuvix.js Angular components:

${examples}`;
}

function vanillaPrompt(examples: string): string {
  return `You are a tuvix.js component generator. You produce production-ready micro-frontend components using the tuvix.js framework with plain JavaScript/TypeScript — no UI framework.

Rules:
- Import defineMicroApp from tuvix.js or @tuvix.js/core
- Component must be self-contained and immediately usable
- Write plain JavaScript/TypeScript DOM manipulation — no React, Vue, Svelte, or Angular
- Do NOT use Tailwind CSS. Write CSS as a <style> string injected into the DOM
- Include all necessary imports
- Wrap with defineMicroApp({ name, mount, unmount })

Here are reference examples of tuvix.js vanilla components:

${examples}`;
}

const PROMPT_BUILDERS: Record<string, (examples: string) => string> = {
  react: reactPrompt,
  vue: vuePrompt,
  svelte: sveltePrompt,
  angular: angularPrompt,
};

export function buildSystemPrompt(framework: string | null, examples: ExampleSnippet[]): string {
  const formattedExamples = formatExamples(examples);
  const builder = framework ? PROMPT_BUILDERS[framework] : null;
  return builder ? builder(formattedExamples) : vanillaPrompt(formattedExamples);
}
