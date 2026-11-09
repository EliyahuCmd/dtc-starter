// Entry file for Cloudways Velocity (PM2 runs this file).
// Builds Medusa if no build exists, runs database migrations,
// then starts the built server on the port Velocity proxies to.
const { execSync, spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

const dir = path.join(__dirname, ".medusa", "server")
const port = process.env.PORT || "3000"

function run(command, cwd) {
  console.log(`[server.js] ${command}`)
  execSync(command, { cwd, stdio: "inherit", env: process.env })
}

try {
  if (!fs.existsSync(path.join(dir, "node_modules"))) {
    console.log("[server.js] No build found, building now (this takes a few minutes)")
    run("npx medusa build", __dirname)
    run("npm install --omit=dev", dir)
  }

  // Create/update database tables on every start
  run("npx medusa db:migrate", dir)
} catch (err) {
  console.error("[server.js] Startup step failed:", err.message)
  process.exit(1)
}

// Start Medusa and forward shutdown signals from PM2
console.log(`[server.js] Starting Medusa on port ${port}`)
const child = spawn("npx", ["medusa", "start", "--port", port], {
  cwd: dir,
  stdio: "inherit",
  env: process.env,
})
child.on("exit", (code) => process.exit(code ?? 1))
process.on("SIGTERM", () => child.kill("SIGTERM"))
process.on("SIGINT", () => child.kill("SIGINT"))
