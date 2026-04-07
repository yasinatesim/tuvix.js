// chatbot/scripts/generate-dataset.ts
import { writeFileSync, mkdirSync } from 'node:fs';
import { join } from 'node:path';

export interface ComponentTemplate {
  variant: string;
  description: string;
  tags: string[];
  code: string;
  dependencies: string[];
}

export interface DatasetRecord {
  id: string;
  description: string;
  framework: string;
  category: string;
  tags: string[];
  code: string;
  dependencies: string[];
}

const FRAMEWORKS = ['react', 'vue', 'svelte', 'angular'] as const;
type Framework = typeof FRAMEWORKS[number];

const CATEGORIES = [
  'header', 'sidebar', 'form', 'card', 'layout',
  'footer', 'modal', 'table', 'navigation', 'notification',
] as const;
type Category = typeof CATEGORIES[number];

async function loadTemplates(framework: Framework, category: Category): Promise<ComponentTemplate[]> {
  const mod = await import(`./templates/${framework}/${category}.js`);
  return mod.default;
}

function buildRecord(
  framework: Framework,
  category: Category,
  template: ComponentTemplate,
  index: number,
): DatasetRecord {
  const pad = String(index + 1).padStart(3, '0');
  return {
    id: `${framework}-${category}-${template.variant}-${pad}`,
    description: template.description,
    framework,
    category,
    tags: template.tags,
    code: template.code,
    dependencies: template.dependencies,
  };
}

async function generate() {
  const OUT_DIR = join(import.meta.dirname, '../data/components');
  mkdirSync(OUT_DIR, { recursive: true });

  let total = 0;

  for (const category of CATEGORIES) {
    const records: DatasetRecord[] = [];

    for (const framework of FRAMEWORKS) {
      const templates = await loadTemplates(framework, category);
      templates.forEach((t, i) => records.push(buildRecord(framework, category, t, i)));
    }

    const jsonl = records.map((r) => JSON.stringify(r)).join('\n') + '\n';
    writeFileSync(join(OUT_DIR, `${category}.jsonl`), jsonl);
    console.log(`${category}: ${records.length} records`);
    total += records.length;
  }

  console.log(`\nTotal: ${total} records`);
  if (total !== 600) {
    console.error(`Expected 600 records, got ${total}`);
    process.exit(1);
  }
}

generate().catch(console.error);
