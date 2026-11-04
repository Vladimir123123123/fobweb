const { spawn } = require("node:child_process");
const path = require("node:path");

const entry = path.join(__dirname, "apps", "api", "src", "index.ts");
const tsx = path.join(__dirname, "node_modules", "tsx", "dist", "cli.mjs");
const child = spawn(process.execPath, [tsx, entry], { stdio: "inherit", cwd: __dirname });

for (const signal of ["SIGINT", "SIGTERM"]) {
  process.on(signal, () => child.kill(signal));
}

child.on("exit", (code) => process.exit(code ?? 1));
