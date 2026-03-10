import { createProject } from './create-project';

const HELP = `
  create-tuvix-app — Scaffold a Tuvix.js project

  Usage:
    npx create-tuvix-app <project-name> [options]

  Options:
    --template <name>    Template to use: shell, react-app, vue-app, vanilla-app (default: shell)
    --typescript         Use TypeScript (default: true)
    --help               Show this help message
    --version            Show version

  Examples:
    npx create-tuvix-app my-shell
    npx create-tuvix-app my-dashboard --template react-app
    npx create-tuvix-app my-settings --template vue-app
`;

function parseArgs(argv: string[]): {
  projectName: string;
  template: string;
  typescript: boolean;
  help: boolean;
  version: boolean;
} {
  const args = argv.slice(2);
  let projectName = '';
  let template = 'shell';
  let typescript = true;
  let help = false;
  let version = false;

  for (let i = 0; i < args.length; i++) {
    const arg = args[i]!;

    if (arg === '--help' || arg === '-h') {
      help = true;
    } else if (arg === '--version' || arg === '-v') {
      version = true;
    } else if (arg === '--template' || arg === '-t') {
      template = args[++i] ?? 'shell';
    } else if (arg === '--no-typescript') {
      typescript = false;
    } else if (!arg.startsWith('-')) {
      projectName = arg;
    }
  }

  return { projectName, template, typescript, help, version };
}

async function main(): Promise<void> {
  const { projectName, template, typescript, help, version } =
    parseArgs(process.argv);

  if (help) {
    console.log(HELP);
    process.exit(0);
  }

  if (version) {
    console.log('create-tuvix-app v0.1.0');
    process.exit(0);
  }

  if (!projectName) {
    console.error('Error: Project name is required.\n');
    console.log(HELP);
    process.exit(1);
  }

  console.log(`\n  ⬡ Creating Tuvix.js project: ${projectName}`);
  console.log(`    Template: ${template}`);
  console.log(`    TypeScript: ${typescript}\n`);

  try {
    await createProject({
      name: projectName,
      template,
      typescript,
    });

    console.log(`\n  ✅ Project "${projectName}" created successfully!\n`);
    console.log('  Next steps:');
    console.log(`    cd ${projectName}`);
    console.log('    npm install');
    console.log('    npm run dev\n');
  } catch (error) {
    console.error(
      '\n  ❌ Error:',
      error instanceof Error ? error.message : error
    );
    process.exit(1);
  }
}

main();
