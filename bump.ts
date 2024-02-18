/**
 * Contains function {@linkcode bump} incrementing the version property of a json file.
 *
 * This module can be run on the command line:
 *
 * ```shell
 * > # bump patch version in deno.json and print new version to stdout
 * > deno run --allow-read --allow-write https://jsr.io/@cotyhamilton/deno-tools/$VERSION/bump.ts --file deno.json --out newVersion
 * ```
 *
 * @module
 */

import { parseArgs } from "jsr:@std/cli@0.216";
import { format, increment, parse } from "jsr:@std/semver@0.216";

/**
 * Increments the version property of a json file.
 *
 * ```ts
 * import { bump } from "jsr:@cotyhamilton/deno-tools/bump";
 *
 * console.log(await bump("./deno.json", {dry: true}));
 * ```
 *
 * @param file The json file to update.
 */
export async function bump(
  file: string,
  opts: BumpOptions = {},
): Promise<
  { oldVersion: string; newVersion: string }
> {
  // const text = await import(file, { with: { type: "text" } }); // waiting on import types
  const versionRegex = /("version": ")(.*?)(")/;
  const text = await _internals.readFile(file);
  const version = text.match(versionRegex)?.[2];
  if (version) {
    const newVersion = format(
      increment(parse(version), opts.type || "patch"),
    );
    const res = { oldVersion: version, newVersion };
    if (opts.dry) {
      return res;
    }
    await _internals.writeFile(
      file,
      text.replace(versionRegex, `$1${newVersion}$3`),
    );
    return res;
  } else {
    throw "Failed to parse version";
  }
}

/** Interface for bump options. */
export interface BumpOptions {
  /** The type of version bump.
   *
   * @default {"patch"}
   */
  type?: "major" | "minor" | "patch";
  /** If true, performs a dry run without modifying the file.
   *
   * @default {false}
   */
  dry?: boolean;
}

/** Internals, used for mocking in tests. */
export const _internals = {
  readFile: async (file: string): Promise<string> =>
    await Deno.readTextFile(file),
  writeFile: async (file: string, data: string): Promise<void> => {
    await Deno.writeTextFile(file, data);
  },
};

async function main() {
  const { type, file = "./deno.json", help, dry, out } = parseArgs(Deno.args, {
    alias: {
      o: "out",
      h: "help",
      t: "type",
      f: "file",
    },
  });

  if (help) {
    printUsage();
    Deno.exit();
  }

  if (out) {
    const res = await bump(file, { type, dry });
    if (out in res) {
      console.log(res[out as keyof typeof res]);
    }
  } else {
    console.log(JSON.stringify(await bump(file, { type, dry })));
  }
}

function printUsage() {
  console.log(`bump
  Increments the version property of a json file.
  
USAGE:
  deno run --allow-read --allow-write bump [options]

OPTIONS:
  --dry                 Enable dry run
  -f, --file <FILE>     Path to the JSON file (default is ./deno.json)
  -h, --help            Prints help information
  -o, --out  <OUT>      A property to print to stdout: oldVersion, newVersion
  -t, --type <TYPE>     Type of increment: major, minor, patch (default is patch)`);
}

if (import.meta.main) {
  main();
}
