// Shared env-var loader for scripts/*.js. Resolves .env.local relative to
// this file's own location (not process.cwd()) so every script works no
// matter what directory it's invoked from — this matters especially for
// cloud-agent runs where the working directory isn't guaranteed.
const fs = require("fs");
const path = require("path");

const envPath = path.join(__dirname, "..", ".env.local");
const envText = fs.readFileSync(envPath, "utf8");

function envVar(name) {
  const m = envText.match(new RegExp(`^${name}=(.*)$`, "m"));
  return m ? m[1].trim() : "";
}

module.exports = { envVar };
