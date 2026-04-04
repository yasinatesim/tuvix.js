import { describe, it, expect, beforeEach, afterEach } from "vitest";
import * as fs from "node:fs";
import * as path from "node:path";
import * as os from "node:os";

import {
  extractLinks,
  shouldSkipUrl,
  isGitHubRepoUrl,
  isAbsoluteUrl,
  checkRelativeLink,
  findMarkdownFiles,
} from "../check-links";

// ─── extractLinks ────────────────────────────────────────────────────────────

describe("extractLinks", () => {
  it("extracts markdown links with correct line numbers", () => {
    const content = "line one\n[click here](./foo.md)\nline three";
    const links = extractLinks(content);

    expect(links).toEqual([{ url: "./foo.md", line: 2 }]);
  });

  it("extracts HTML href links", () => {
    const content = '<a href="https://example.org/page">link</a>';
    const links = extractLinks(content);

    expect(links).toEqual([{ url: "https://example.org/page", line: 1 }]);
  });

  it("extracts both markdown and HTML links from same line", () => {
    const content =
      '[md](./a.md) and <a href="./b.md">html</a>';
    const links = extractLinks(content);

    expect(links).toHaveLength(2);
    expect(links[0].url).toBe("./a.md");
    expect(links[1].url).toBe("./b.md");
  });

  it("handles markdown links with title text", () => {
    const content = '[text](./file.md "Title text")';
    const links = extractLinks(content);

    // Should extract just the URL part before the space
    expect(links).toEqual([{ url: "./file.md", line: 1 }]);
  });

  it("extracts multiple links across multiple lines", () => {
    const content = [
      "# Header",
      "[link1](./a.md)",
      "Some text",
      "[link2](./b.md) and [link3](./c.md)",
    ].join("\n");

    const links = extractLinks(content);

    expect(links).toHaveLength(3);
    expect(links[0]).toEqual({ url: "./a.md", line: 2 });
    expect(links[1]).toEqual({ url: "./b.md", line: 4 });
    expect(links[2]).toEqual({ url: "./c.md", line: 4 });
  });

  it("returns empty array for content with no links", () => {
    const content = "Just some plain text\nwith no links at all.";
    const links = extractLinks(content);

    expect(links).toEqual([]);
  });

  it("handles single-quoted href attributes", () => {
    const content = "<a href='./page.md'>link</a>";
    const links = extractLinks(content);

    expect(links).toEqual([{ url: "./page.md", line: 1 }]);
  });
});

// ─── shouldSkipUrl ───────────────────────────────────────────────────────────

describe("shouldSkipUrl", () => {
  it("skips anchor-only links", () => {
    expect(shouldSkipUrl("#section")).toBe(true);
    expect(shouldSkipUrl("#")).toBe(true);
  });

  it("skips localhost URLs", () => {
    expect(shouldSkipUrl("http://localhost:3000/foo")).toBe(true);
  });

  it("skips 127.0.0.1 URLs", () => {
    expect(shouldSkipUrl("http://127.0.0.1:8080/bar")).toBe(true);
  });

  it("skips example.com URLs", () => {
    expect(shouldSkipUrl("https://example.com/path")).toBe(true);
  });

  it("skips cdn.example.com URLs", () => {
    expect(shouldSkipUrl("https://cdn.example.com/asset.js")).toBe(true);
  });

  it("skips fonts.googleapis.com URLs", () => {
    expect(shouldSkipUrl("https://fonts.googleapis.com/css")).toBe(true);
  });

  it("does not skip relative links", () => {
    expect(shouldSkipUrl("./foo.md")).toBe(false);
    expect(shouldSkipUrl("../bar.md")).toBe(false);
  });

  it("does not skip other external URLs", () => {
    expect(shouldSkipUrl("https://github.com/user/repo")).toBe(false);
  });
});

// ─── isGitHubRepoUrl ────────────────────────────────────────────────────────

describe("isGitHubRepoUrl", () => {
  it("returns true for the repo root URL", () => {
    expect(isGitHubRepoUrl("https://github.com/yasinatesim/tuvix.js")).toBe(
      true,
    );
  });

  it("returns true for repo subpath URLs", () => {
    expect(
      isGitHubRepoUrl(
        "https://github.com/yasinatesim/tuvix.js/discussions",
      ),
    ).toBe(true);
  });

  it("returns false for other GitHub URLs", () => {
    expect(isGitHubRepoUrl("https://github.com/other/repo")).toBe(false);
  });

  it("returns false for non-GitHub URLs", () => {
    expect(isGitHubRepoUrl("https://example.com")).toBe(false);
  });
});

// ─── isAbsoluteUrl ──────────────────────────────────────────────────────────

describe("isAbsoluteUrl", () => {
  it("returns true for https URLs", () => {
    expect(isAbsoluteUrl("https://example.com")).toBe(true);
  });

  it("returns true for http URLs", () => {
    expect(isAbsoluteUrl("http://example.com")).toBe(true);
  });

  it("returns false for relative paths", () => {
    expect(isAbsoluteUrl("./foo.md")).toBe(false);
    expect(isAbsoluteUrl("../bar")).toBe(false);
    expect(isAbsoluteUrl("file.md")).toBe(false);
  });

  it("returns false for anchor links", () => {
    expect(isAbsoluteUrl("#section")).toBe(false);
  });
});

// ─── checkRelativeLink ──────────────────────────────────────────────────────

describe("checkRelativeLink", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "check-links-test-"));
    // Create test structure:
    // tmpDir/
    //   source.md
    //   target.md
    //   subdir/
    //     index.md
    //   noext       (file without .md)
    fs.writeFileSync(path.join(tmpDir, "source.md"), "");
    fs.writeFileSync(path.join(tmpDir, "target.md"), "");
    fs.mkdirSync(path.join(tmpDir, "subdir"));
    fs.writeFileSync(path.join(tmpDir, "subdir", "index.md"), "");
    fs.writeFileSync(path.join(tmpDir, "noext"), "");
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("returns null when target file exists", () => {
    const source = path.join(tmpDir, "source.md");
    const result = checkRelativeLink(source, "./target.md");

    expect(result).toBeNull();
  });

  it("returns null when target exists after adding .md extension", () => {
    const source = path.join(tmpDir, "source.md");
    const result = checkRelativeLink(source, "./target");

    expect(result).toBeNull();
  });

  it("returns null when target directory has index.md", () => {
    const source = path.join(tmpDir, "source.md");
    const result = checkRelativeLink(source, "./subdir");

    expect(result).toBeNull();
  });

  it("returns error message when target does not exist", () => {
    const source = path.join(tmpDir, "source.md");
    const result = checkRelativeLink(source, "./nonexistent.md");

    expect(result).not.toBeNull();
    expect(result).toContain("File not found");
  });

  it("strips hash fragment before checking", () => {
    const source = path.join(tmpDir, "source.md");
    const result = checkRelativeLink(source, "./target.md#section");

    expect(result).toBeNull();
  });

  it("strips query string before checking", () => {
    const source = path.join(tmpDir, "source.md");
    const result = checkRelativeLink(source, "./target.md?v=1");

    expect(result).toBeNull();
  });

  it("returns null for empty URL after stripping fragment", () => {
    const source = path.join(tmpDir, "source.md");
    const result = checkRelativeLink(source, "#just-anchor");

    expect(result).toBeNull();
  });
});

// ─── findMarkdownFiles ──────────────────────────────────────────────────────

describe("findMarkdownFiles", () => {
  let tmpDir: string;

  beforeEach(() => {
    tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), "find-md-test-"));
  });

  afterEach(() => {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  });

  it("finds .md files in root directory", () => {
    fs.writeFileSync(path.join(tmpDir, "readme.md"), "");
    fs.writeFileSync(path.join(tmpDir, "other.txt"), "");

    const files = findMarkdownFiles(tmpDir);

    expect(files).toHaveLength(1);
    expect(files[0]).toContain("readme.md");
  });

  it("finds .md files recursively in subdirectories", () => {
    fs.mkdirSync(path.join(tmpDir, "docs"));
    fs.writeFileSync(path.join(tmpDir, "readme.md"), "");
    fs.writeFileSync(path.join(tmpDir, "docs", "guide.md"), "");

    const files = findMarkdownFiles(tmpDir);

    expect(files).toHaveLength(2);
  });

  it("skips node_modules directory", () => {
    fs.mkdirSync(path.join(tmpDir, "node_modules"));
    fs.writeFileSync(path.join(tmpDir, "node_modules", "pkg.md"), "");
    fs.writeFileSync(path.join(tmpDir, "readme.md"), "");

    const files = findMarkdownFiles(tmpDir);

    expect(files).toHaveLength(1);
    expect(files[0]).toContain("readme.md");
  });

  it("skips .git directory", () => {
    fs.mkdirSync(path.join(tmpDir, ".git"));
    fs.writeFileSync(path.join(tmpDir, ".git", "HEAD.md"), "");

    const files = findMarkdownFiles(tmpDir);

    expect(files).toHaveLength(0);
  });

  it("skips dist directory", () => {
    fs.mkdirSync(path.join(tmpDir, "dist"));
    fs.writeFileSync(path.join(tmpDir, "dist", "output.md"), "");

    const files = findMarkdownFiles(tmpDir);

    expect(files).toHaveLength(0);
  });

  it("skips .claude directory", () => {
    fs.mkdirSync(path.join(tmpDir, ".claude"));
    fs.writeFileSync(path.join(tmpDir, ".claude", "notes.md"), "");

    const files = findMarkdownFiles(tmpDir);

    expect(files).toHaveLength(0);
  });

  it("returns empty array for directory with no .md files", () => {
    fs.writeFileSync(path.join(tmpDir, "file.txt"), "");

    const files = findMarkdownFiles(tmpDir);

    expect(files).toEqual([]);
  });
});
