#!/usr/bin/env node

const { script, file, directory, command, print } = require("../.build/src")
const Path = require("path")

script(async () => {
  const package_json = file.read.json("./package.json")
  print.info("Build project:", package_json.name)

  // Clean before build
  print.info(`[step: Clean before build]`)
  {
    directory.remove("./dist")
  }

  /*
     Build typescript
  */
     print.info(`[step: Build typescript]`)
     {
       const tsconfig = file.read.json("./tsconfig.json")
       tsconfig.compilerOptions.module = "ES2015"
       tsconfig.compilerOptions.declaration = true
       tsconfig.compilerOptions.outDir = "./dist/.build"
       file.write.json("./.build.tsconfig.json", tsconfig)
       command.exec("tspc -p ./.build.tsconfig.json")
       file.remove("./.build.tsconfig.json")
   
     }
   
  /*
     Rollup script
  */
  print.info(`[step: Rollup script]`)
  {
    await rollup_script(package_json, false, './dist/.build/src/index.js', './dist/index.js')
    await rollup_types_definition(package_json, './dist/.build/src/index.d.ts', './dist/index.d.ts')
    directory.remove("./dist/.build")
  }

  /*
     Build package resources
  */
  print.info(`[step: Build package resources]`)
  {
    file.write.json("./dist/package.json", {
      ...package_json,
      "main": "index.js",
      "types": "index.d.ts",
      "dependencies": undefined,
      "devDependencies": undefined,
      "scripts": undefined
    })

    file.copy.toFile("./README.md", "./dist/README.md")
  }
})

async function rollup_script(package_json, minify, input, output) {
  const { rollup } = require('rollup')
  const { terser } = require('rollup-plugin-terser')
  const localResolve = require('rollup-plugin-local-resolve')
  const dependencies = Object.keys(package_json.dependencies || {})
  await rollup({
    input: Path.resolve(input),
    external: dependencies.concat([
      "fs",
      "path",
      "process",
      "crypto",
      "http",
      "child_process",
    ]),
    plugins: [
      localResolve(),
      minify && terser(),
    ]
  }).then(bundle => {
    return bundle.write({
      file: output,
      format: 'cjs',
      name: package_json.name,
      sourcemap: false
    });
  }, (e) => {
    console.error("> Generation has crashed !!!")
    console.error(e)
  });
}

async function rollup_types_definition(package_json, input, output) {
  command.call("node", [
    require.resolve("dts-bundle-generator/dist/bin/dts-bundle-generator.js"),
    "--no-check",
    "-o", Path.resolve(output),
    Path.resolve(input)
  ])
}

