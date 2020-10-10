#!/usr/bin/env node

const { script } = require('../.build/src');
const nodeWatch = require("node-watch");
const process = require('process');
const child_process = require('child_process');
const Module = require('module');

script((argv) => {
  var current = null;
  var currentRestart_timer = undefined;

  function start() {
    console.log(`\x1b[32m[monitor] Start process\x1b[0m`)
    let nodeargs = []
    if (argv["inspect"]) nodeargs.push("--inspect=" + argv["inspect"])
    else if (arvg["inspect-brk"]) nodeargs.push("--inspect-brk=" + arvg["inspect-brk"])
    current = child_process.spawn(
      "node",
      [
        "--require=" + require.resolve("source-map-support/register"),
        "--enable-source-maps",
        ...nodeargs,
        argv.program,
        ...(argv.args || [])
      ],
      {
        stdio: [process.stdin, process.stdout, process.stderr],
      }
    );
    current.on("exit", (code) => {
      current = null
      if (currentRestart_timer !== undefined) {
        console.log(`\x1b[32m[monitor] Restart after 'change'\x1b[0m`)
        currentRestart_timer = undefined;
        start()
      }
      else {
        console.log(`\x1b[${code < 0 ? "31m" : "33m"}[monitor] Process 'exit' (Press enter to restart)\x1b[0m`)
        process.stdin.on('readable', () => {
          process.stdin.read()
          process.stdin.removeAllListeners()
          start()
        })
      }
    })
  }
  function restart() {
    if (current !== null && currentRestart_timer === undefined) {
      const timer = setTimeout(() => {
        if (currentRestart_timer === timer) {
          console.log(`\x1b[32m[monitor] Kill process, after 'change'\x1b[0m`)
          current.kill();
        }
      }, 100);
      currentRestart_timer = timer
    }
  }

  nodeWatch(argv.watch, { recursive: true }).on('change', (change, path) => {
    restart();
  })
  start();

}, {
  "watch": {
    type: "string",
    required: true,
  },
  "program": {
    type: "string",
    required: true,
  },
  "inspect": {
    type: "number",
  },
  "inspect-brk": {
    type: "number",
  },
  "args": {
    type: "string",
    isArray: true,
    closure: true
  }
})
