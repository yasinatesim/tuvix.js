import * as fs from "node:fs";
import * as path from "node:path";
import * as https from "node:https";
import * as http from "node:http";

export interface BrokenLink {
  file: string;
  line: number;
  url: string;
  reason: string;
}

export interface ExtractedLink {
  url: string;
  line: number;
}

export const SKIP_DIRS = new Set(["node_modules", ".git", "dist", ".claude"]);

export const SKIP_HOSTS = new Set([
  "localhost",
  "127.0.0.1",
  "example.com",
  "cdn.example.com",
  "fonts.googleapis.com",
]);

export const GITHUB_REPO_PREFIX =
  "https://github.com/yasinatesim/tuvix.js";

const HTTP_TIMEOUT_MS = 10_000;
const RATE_LIMIT_DELAY_MS = 500;

export function findMarkdownFiles(dir: string): string[] {
  const results: string[] = [];
  const entries = fs.readdirSync(dir, { withFileTypes: true });

  for (const entry of entries) {
    if (SKIP_DIRS.has(entry.name)) {
      continue;
    }

    const fullPath = path.join(dir, entry.name);

    if (entry.isDirectory()) {
      results.push(...findMarkdownFiles(fullPath));
    } else if (entry.isFile() && entry.name.endsWith(".md")) {
      results.push(fullPath);
    }
  }

  return results;
}

export function extractLinks(content: string): ExtractedLink[] {
  const links: ExtractedLink[] = [];
  const lines = content.split("\n");

  const markdownLinkRegex = /\[(?:[^\]]*)\]\(([^)]+)\)/g;
  const htmlHrefRegex = /href=["']([^"']+)["']/g;

  for (let i = 0; i < lines.length; i++) {
    const lineContent = lines[i];
    const lineNumber = i + 1;

    let match: RegExpExecArray | null;

    markdownLinkRegex.lastIndex = 0;
    while ((match = markdownLinkRegex.exec(lineContent)) !== null) {
      const url = match[1].split(" ")[0].trim();
      if (url) {
        links.push({ url, line: lineNumber });
      }
    }

    htmlHrefRegex.lastIndex = 0;
    while ((match = htmlHrefRegex.exec(lineContent)) !== null) {
      const url = match[1].trim();
      if (url) {
        links.push({ url, line: lineNumber });
      }
    }
  }

  return links;
}

export function shouldSkipUrl(url: string): boolean {
  if (url.startsWith("#")) {
    return true;
  }

  try {
    const parsed = new URL(url);
    if (SKIP_HOSTS.has(parsed.hostname)) {
      return true;
    }
  } catch {
    // Not an absolute URL — relative link, don't skip
  }

  return false;
}

export function isGitHubRepoUrl(url: string): boolean {
  return url.startsWith(GITHUB_REPO_PREFIX);
}

export function isAbsoluteUrl(url: string): boolean {
  return url.startsWith("http://") || url.startsWith("https://");
}

export function checkRelativeLink(
  filePath: string,
  url: string,
): string | null {
  const cleanUrl = url.split("#")[0].split("?")[0];

  if (!cleanUrl) {
    return null;
  }

  const fileDir = path.dirname(filePath);
  const resolved = path.resolve(fileDir, cleanUrl);

  if (fs.existsSync(resolved)) {
    return null;
  }

  if (!resolved.endsWith(".md")) {
    const withMd = resolved + ".md";
    if (fs.existsSync(withMd)) {
      return null;
    }
  }

  const indexMd = path.join(resolved, "index.md");
  if (fs.existsSync(indexMd)) {
    return null;
  }

  return `File not found: ${resolved}`;
}

export function httpHeadCheck(url: string): Promise<string | null> {
  return new Promise((resolve) => {
    const parsedUrl = new URL(url);
    const client = parsedUrl.protocol === "https:" ? https : http;

    const req = client.request(
      parsedUrl,
      { method: "HEAD", timeout: HTTP_TIMEOUT_MS },
      (res) => {
        const status = res.statusCode ?? 0;
        if (status >= 400) {
          resolve(`HTTP ${status}`);
        } else {
          resolve(null);
        }
      },
    );

    req.on("timeout", () => {
      req.destroy();
      resolve("Timeout after 10s");
    });

    req.on("error", (err: Error) => {
      resolve(`Request error: ${err.message}`);
    });

    req.end();
  });
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main(): Promise<void> {
  const rootDir = path.resolve(
    path.dirname(new URL(import.meta.url).pathname),
    "..",
  );

  console.log(`Scanning for .md files in: ${rootDir}\n`);

  const mdFiles = findMarkdownFiles(rootDir);
  console.log(`Found ${mdFiles.length} markdown file(s)\n`);

  const brokenLinks: BrokenLink[] = [];
  let totalLinksChecked = 0;
  let httpChecksCount = 0;

  for (const filePath of mdFiles) {
    const content = fs.readFileSync(filePath, "utf-8");
    const links = extractLinks(content);

    for (const link of links) {
      if (shouldSkipUrl(link.url)) {
        continue;
      }

      totalLinksChecked++;

      if (isAbsoluteUrl(link.url)) {
        if (isGitHubRepoUrl(link.url)) {
          if (httpChecksCount > 0) {
            await delay(RATE_LIMIT_DELAY_MS);
          }
          httpChecksCount++;

          const reason = await httpHeadCheck(link.url);
          if (reason) {
            brokenLinks.push({
              file: path.relative(rootDir, filePath),
              line: link.line,
              url: link.url,
              reason,
            });
          }
        }
        // Non-GitHub external URLs are skipped (not checked)
        continue;
      }

      const reason = checkRelativeLink(filePath, link.url);
      if (reason) {
        brokenLinks.push({
          file: path.relative(rootDir, filePath),
          line: link.line,
          url: link.url,
          reason,
        });
      }
    }
  }

  console.log(`Total links checked: ${totalLinksChecked}`);
  console.log(`HTTP checks performed: ${httpChecksCount}`);

  if (brokenLinks.length > 0) {
    console.log(`\nBroken links found: ${brokenLinks.length}\n`);
    for (const bl of brokenLinks) {
      console.log(`  File:   ${bl.file}`);
      console.log(`  Line:   ${bl.line}`);
      console.log(`  URL:    ${bl.url}`);
      console.log(`  Reason: ${bl.reason}`);
      console.log("");
    }
    process.exit(1);
  } else {
    console.log("\nAll links OK!");
    process.exit(0);
  }
}

// Only run main when executed directly (not when imported for testing)
const scriptPath = new URL(import.meta.url).pathname;
const isDirectExecution =
  process.argv[1] !== undefined &&
  path.resolve(process.argv[1]) === path.resolve(scriptPath);

if (isDirectExecution) {
  main().catch((err: unknown) => {
    console.error("Unexpected error:", err);
    process.exit(1);
  });
}
