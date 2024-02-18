import { assertEquals, assertRejects } from "jsr:@std/assert@0.216";
import { assertSpyCalls, stub } from "jsr:@std/testing@0.216/mock";
import { _internals, bump } from "./bump.ts";

Deno.test("test version bumping", async () => {
  const readFileStub = stub(
    _internals,
    "readFile",
    () => Promise.resolve('{"version": "0.2.1"}'),
  );
  const writeFileStub = stub(_internals, "writeFile", () => Promise.resolve());

  try {
    assertEquals(await bump({ file: "./fake.json", type: "patch" }), {
      oldVersion: "0.2.1",
      newVersion: "0.2.2",
    });
    assertEquals(await bump({ file: "./fake.json", type: "minor" }), {
      oldVersion: "0.2.1",
      newVersion: "0.3.0",
    });
    assertEquals(await bump({ file: "./fake.json", type: "major" }), {
      oldVersion: "0.2.1",
      newVersion: "1.0.0",
    });
  } finally {
    readFileStub.restore();
    writeFileStub.restore();
  }

  assertSpyCalls(writeFileStub, 3);
});

Deno.test("test dry run", async () => {
  const readFileStub = stub(
    _internals,
    "readFile",
    () => Promise.resolve('{"version": "0.2.1"}'),
  );
  const writeFileStub = stub(_internals, "writeFile", () => Promise.resolve());

  try {
    assertEquals(
      await bump({ file: "./fake.json", type: "patch", dry: true }),
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
    assertRejects(async () =>
      await bump({ file: "./fake.json", type: "patch" })
    );
  } finally {
    readFileStub.restore();
  }
});
