/**
 * This script is executed after calling `changeset version`.
 *
 * It will adjust some packages to stay in alpha if necessary - as changesets doesn't allow for mixed repositories.
 */

import { $ } from "zx";
import { getPackages } from "@manypkg/get-packages";
import { join, relative } from "node:path";
import { parse } from "semver";
import pacote from "pacote";
import { readFile, writeFile } from "node:fs/promises";
const { packument } = pacote;

const fixedTags: Record<string, "alpha" | "beta" | "rc" | "skip"> = {
  "@apollo/client-integration-tanstack-start": `rc`,
  "@apollo/client-integration-react-router": `alpha`,
} as const;

const rootDir = join(import.meta.dirname, "..");

const packages = (await getPackages(rootDir)).packages;
const changedPackages: Record<string, string> = {};
const localReference = /^(workspace:)|\*$/;

for (const pkg of packages) {
  const name = pkg.packageJson.name;
  if (name in fixedTags) {
    const tag = fixedTags[name as keyof typeof fixedTags];
    const parsed = parse(pkg.packageJson.version)!;
    if (tag === "skip") {
      const oldInfo =
        await $`git show HEAD:${relative(rootDir, join(pkg.dir, "package.json"))}`;
      const oldPkg = JSON.parse(oldInfo.stdout);
      changedPackages[name] = oldPkg.version;
      continue;
    }
    if (parsed.prerelease?.[0] !== tag) {
      const { major, minor, patch } = parsed;
      parsed.inc("prerelease", tag);
      parsed.major = major;
      parsed.minor = minor;
      parsed.patch = patch;
      const info = await packument(name);
      while (parsed.format() in info.versions) {
        parsed.inc("prerelease", tag);
      }
      changedPackages[name] = parsed.format();
    }
  }
}
for (const pkg of packages) {
  for (const [name, version] of Object.entries(changedPackages)) {
    if (
      pkg.packageJson.dependencies?.[name] &&
      !pkg.packageJson.dependencies[name].match(localReference)
    ) {
      await $`npm --workspace=${pkg.packageJson.name} pkg set dependencies.${name}=${version}`;
    }
    if (
      pkg.packageJson.devDependencies?.[name] &&
      !pkg.packageJson.devDependencies[name].match(localReference)
    ) {
      await $`npm --workspace=${pkg.packageJson.name} pkg set devDependencies.${name}=${version}`;
    }
    if (
      pkg.packageJson.peerDependencies?.[name] &&
      !pkg.packageJson.peerDependencies[name].match(localReference)
    ) {
      await $`npm --workspace=${pkg.packageJson.name} pkg set peerDependencies.${name}=${version}`;
    }
  }
}
for (const [name, newVersion] of Object.entries(changedPackages)) {
  const pkg = packages.find((p) => p.packageJson.name === name);
  if (!pkg) continue;
  const oldVersion = pkg.packageJson.version;
  await $`npm --workspace=${name} pkg set version=${newVersion}`;

  const changelogPath = join(pkg.dir, "CHANGELOG.md");

  const changelog = await readFile(changelogPath, "utf-8");
  const updated = changelog.replace(
    new RegExp(
      `^## ${
        // @ts-expect-error this is present in node 24, but `@node/types` deliberately is on node 24 for the workspace
        RegExp.escape(oldVersion)
      }$`,
      "m"
    ),
    `## ${newVersion}`
  );
  if (updated !== changelog) {
    await writeFile(changelogPath, updated, "utf-8");
  }
}
