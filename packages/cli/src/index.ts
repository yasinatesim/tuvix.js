import { createProject } from './create-project';
import { runPrompts } from './prompts';
import { detectPackageManager } from './detect-pm';
import { installDependencies } from './install';
import * as path from 'path';

const HELP = `
  create-tuvix-app — Scaffold a Tuvix.js project

  Usage:
    npx create-tuvix-app [project-name] [options]

  Options:
    --template <name>    Template: shell, react-app, vue-app, svelte-app, angular-app, vanilla-app
    --example <name>     Download a fully scaffolded example (e.g., with-react)
    --typescript         Use TypeScript
    --no-typescript      Use JavaScript
    --help               Show this help message
    --version            Show version

  Examples:
    npx create-tuvix-app
    npx create-tuvix-app my-app
    npx create-tuvix-app my-app --template react-app --typescript
    npx create-tuvix-app my-app --example with-react
`;

interface ParsedArgs {
  projectName: string | undefined;
  template: string | undefined;
  typescript: boolean | undefined;
  example: string | null;
  help: boolean;
  version: boolean;
}

export function parseArgs(argv: string[]): ParsedArgs {
  const args = argv.slice(2);
  let projectName: string | undefined;
  let template: string | undefined;
  let example: string | null = null;
  let typescript: boolean | undefined;
  let help = false;
  let version = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--version' || arg === '-v') {
      version = true;
    } else if (arg === '--template' || arg === '-t') {
      template = args[++i];
    } else if (arg === '--example' || arg === '-e') {
      example = args[++i] ?? null;
    } else if (arg === '--typescript') {
      typescript = true;
    } else if (arg === '--no-typescript') {
      typescript = false;
    } else if (!arg.startsWith('-')) {
      projectName = arg;
    }
  }

  return { projectName, template, typescript, example, help, version };
}

async function main(): Promise<void> {
  const parsed = parseArgs(process.argv);

  if (parsed.help) {
    console.log(HELP);
    process.exit(0);
  }

  if (parsed.version) {
    console.log('create-tuvix-app v0.1.0');
    process.exit(0);
  }

  // --example skips prompts entirely
  if (parsed.example) {
    const projectName = parsed.projectName ?? 'my-app';
    console.log(`\n  Creating Tuvix.js project: ${projectName}`);
    console.log(`  Example: ${parsed.example}\n`);
    try {
      await createProject({
        name: projectName,
        template: 'shell',
        typescript: true,
        example: parsed.example,
      });
      const pm = detectPackageManager();
      console.log(`\n  Project "${projectName}" created successfully!\n`);
      console.log('  Next steps:');
      console.log(`    cd ${projectName}`);
      console.log(`    ${pm} install`);
      console.log(`    ${pm} run dev\n`);
    } catch (error) {
      console.error('\n  Error:', error instanceof Error ? error.message : error);
      process.exit(1);
    }
    return;
  }

  // Run interactive prompts for any unspecified values
  const resolved = await runPrompts({
    projectName: parsed.projectName,
    template: parsed.template,
    typescript: parsed.typescript,
  });

  const pm = detectPackageManager();
  const targetDir = path.resolve(process.cwd(), resolved.projectName);

  try {
    await createProject({
      name: resolved.projectName,
      template: resolved.template,
      typescript: resolved.typescript,
    });
    await installDependencies(targetDir, pm);
  } catch (error) {
    console.error('\n  Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }

  console.log(`\n  ${resolved.projectName} is ready!\n`);
  console.log('  Next steps:');
  console.log(`    cd ${resolved.projectName}`);
  console.log(`    ${pm} run dev\n`);
}

if (!process.env.VITEST) {
  main();
}
