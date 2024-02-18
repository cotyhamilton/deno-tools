/**
 * Contains function {@linkcode bump} incrementing the version property of a json file.
 *
 * This module can be run on the command line:
 *
 * ```shell
 * > # bump patch version in deno.json and print new version to stdout
 * > deno run --allow-read --allow-write https://jsr.io/@cotyhamilton/tools/$VERSION/bump.ts --file deno.json --out newVersion
 * ```
 *
 * @module
 */

import { parseArgs } from "jsr:@std/cli@0.216";
import { format, increment, parse } from "jsr:@std/semver@0.216";

/**
 * Increments the version property of a json file.
 * @param {Object} options - Options for bumping the version.
 * @param {string} [options.file="./deno.json"] - The file to update.
 * @param {"major" | "minor" | "patch"} [options.type="patch"] - The type of version bump.
 * @param {boolean} [options.dry=false] - If true, performs a dry run without modifying the file.
 * @returns {Promise<{ oldVersion: string, newVersion: string }>} - A promise resolving to an object containing the old and new versions.
 */
export async function bump({
  file = "./deno.json",
  type = "patch",
  dry = false,
}: {
  file?: string;
  type?: "major" | "minor" | "patch";
  dry?: boolean;
}): Promise<{ oldVersion: string; newVersion: string }> {
  // const text = await import(file, { with: { type: "text" } }); // waiting on import types
  const versionRegex = /("version": ")(.*?)(")/;
  const text = await _internals.readFile(file);
  const version = text.match(versionRegex)?.[2];
  if (version) {
    const newVersion = format(increment(parse(version), type));
    const res = { oldVersion: version, newVersion };
    if (dry) {
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

export const _internals = {
  readFile: async (file: string) => await Deno.readTextFile(file),
  writeFile: async (file: string, data: string) => {
    await Deno.writeTextFile(file, data);
  },
};

async function main() {
  const { type, file, help, dry, out } = parseArgs(Deno.args, {
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
    const res = await bump({ file, type, dry });
    if (out in res) {
      console.log(res[out as keyof typeof res]);
    }
  } else {
    console.log(JSON.stringify(await bump({ file, type, dry })));
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
  -o, --out  <OUT>      The property to print to stdout: oldVersion, newVersion
  -t, --type <TYPE>     Type of increment: major, minor, patch (default is patch)`);
}

if (import.meta.main) {
  main();
}
