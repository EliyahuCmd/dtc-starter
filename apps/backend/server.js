// Entry file for Cloudways Velocity (PM2 runs this file).
// Builds Medusa if no build exists, runs database migrations,
// then starts the built server on the port Velocity proxies to.
const { execSync, execFileSync, spawn } = require("child_process")
const fs = require("fs")
const path = require("path")

const dir = path.join(__dirname, ".medusa", "server")
const port = process.env.PORT || "3000"
const host = process.env.HOST || "0.0.0.0"

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

// Optional one-time admin user creation. Set ADMIN_EMAIL and ADMIN_PASSWORD,
// redeploy once, then remove both variables. Failure (e.g. the user already
// exists) is logged but does not stop the server.
if (process.env.ADMIN_EMAIL && process.env.ADMIN_PASSWORD) {
  try {
    console.log(`[server.js] Creating admin user ${process.env.ADMIN_EMAIL}`)
    execFileSync(
      "npx",
      ["medusa", "user", "-e", process.env.ADMIN_EMAIL, "-p", process.env.ADMIN_PASSWORD],
      { cwd: dir, stdio: "inherit", env: process.env }
    )
  } catch (err) {
    console.error("[server.js] Admin user not created (it may already exist):", err.message)
  }
}

// Start Medusa and forward shutdown signals from PM2
console.log(`[server.js] Starting Medusa on ${host}:${port}`)
// Listen on all interfaces: "localhost" can resolve to IPv6 (::1) on newer
// Node versions, while Velocity's web server proxies to 127.0.0.1.
const child = spawn("npx", ["medusa", "start", "--host", host, "--port", port], {
  cwd: dir,
  stdio: "inherit",
  env: process.env,
})
child.on("exit", (code) => process.exit(code ?? 1))
process.on("SIGTERM", () => child.kill("SIGTERM"))
process.on("SIGINT", () => child.kill("SIGINT"))
