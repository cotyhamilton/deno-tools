import { assert, assertEquals, assertRejects } from "jsr:@std/assert";
import { assertSpyCalls, stub } from "jsr:@std/testing/mock";
import { _internals, bump } from "./bump.ts";
import denoConfig from "./deno.json" with { type: "json" };

Deno.test("version bump", async () => {
  const readFileStub = stub(
    _internals,
    "readFile",
    () => Promise.resolve('{"version": "0.2.1"}'),
  );
  const writeFileStub = stub(_internals, "writeFile", () => Promise.resolve());

  try {
    assertEquals(await bump("./fake.json", { type: "patch" }), {
      oldVersion: "0.2.1",
      newVersion: "0.2.2",
    });
    assertEquals(await bump("./fake.json", { type: "minor" }), {
      oldVersion: "0.2.1",
      newVersion: "0.3.0",
    });
    assertEquals(await bump("./fake.json", { type: "major" }), {
      oldVersion: "0.2.1",
      newVersion: "1.0.0",
    });
  } finally {
    readFileStub.restore();
    writeFileStub.restore();
  }

  assertSpyCalls(writeFileStub, 3);
});

Deno.test("dry run", async () => {
  const readFileStub = stub(
    _internals,
    "readFile",
    () => Promise.resolve('{"version": "0.2.1"}'),
  );
  const writeFileStub = stub(_internals, "writeFile", () => Promise.resolve());

  try {
    assertEquals(
      await bump("./fake.json", { type: "patch", dry: true }),
      { oldVersion: "0.2.1", newVersion: "0.2.2" },
    );
  } finally {
    readFileStub.restore();
  }

  assertSpyCalls(writeFileStub, 0);
});

Deno.test("throws when can't parse version", () => {
  const readFileStub = stub(
    _internals,
    "readFile",
    () => Promise.resolve('{"version": "0.2"}'),
  );

  try {
    assertRejects(async () => await bump("./fake.json", { type: "patch" }));
  } finally {
    readFileStub.restore();
  }
});

Deno.test("standalone script", async () => {
  const command = new Deno.Command(Deno.execPath(), {
    args: [
      "run",
      "--no-check",
      "--quiet",
      "--no-lock",
      "--config",
      "deno.json",
      "--allow-read=deno.json",
      "./bump.ts",
      "--out",
      "oldVersion",
      "--dry",
    ],
  });
  const { stdout } = await command.output();
  const output = new TextDecoder().decode(stdout);
  assert(output.includes(`${denoConfig.version}`));
});
