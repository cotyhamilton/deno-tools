# deno tools

## bump

Increment a version in a json file

```sh
# increment patch in deno.json and print new version to stdout
deno run --allow-read=deno.json --allow-write=deno.json jsr:@cotyhamilton/deno-tools/bump --type patch --file deno.json --out newVersion

# dry run
deno run .../bump.ts --dry

# help
deno run .../bump.ts --help
```
