import { intro, text, select, confirm, cancel, isCancel } from '@clack/prompts';

export interface ResolvedOptions {
  projectName: string;
  template: string;
  typescript: boolean;
}

export async function runPrompts(args: {
  projectName: string | undefined;
  template: string | undefined;
  typescript: boolean | undefined;
}): Promise<ResolvedOptions> {
  intro('create-tuvix-app');

  // Step 1: Project name
  let projectName = args.projectName;
  if (!projectName) {
    const result = await text({
      message: 'Project name',
      placeholder: 'my-app',
      validate: (v) => (!v.trim() ? 'Name is required' : undefined),
    });
    if (isCancel(result)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    projectName = result as string;
  }

  // Step 2: Template
  let template = args.template;
  if (!template) {
    const result = await select({
      message: 'Template',
      options: [
        { value: 'shell',        label: 'Shell',      hint: 'orchestrator with routing' },
        { value: 'react-app',    label: 'React',      hint: 'micro-app' },
        { value: 'vue-app',      label: 'Vue',        hint: 'micro-app' },
        { value: 'svelte-app',   label: 'Svelte',     hint: 'micro-app' },
        { value: 'angular-app',  label: 'Angular',    hint: 'micro-app' },
        { value: 'vanilla-app',  label: 'Vanilla JS', hint: 'micro-app' },
      ],
    });
    if (isCancel(result)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    template = result as string;
  }

  // Step 3: TypeScript
  let typescript = args.typescript;
  if (typescript === undefined) {
    const result = await confirm({
      message: 'Use TypeScript?',
      initialValue: true,
    });
    if (isCancel(result)) {
      cancel('Operation cancelled.');
      process.exit(0);
    }
    typescript = result as boolean;
  }

  // Angular always requires TypeScript
  if (template === 'angular-app' && !typescript) {
    console.log('  Angular requires TypeScript. Switching to TypeScript automatically.');
    typescript = true;
  }

  return { projectName, template, typescript };
}
