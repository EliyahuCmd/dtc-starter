// Entry file for Cloudways Velocity (PM2 runs this file).
// Runs database migrations, then starts the built Medusa server.
const { execSync, spawn } = require("child_process")
const path = require("path")

const dir = path.join(__dirname, ".medusa", "server")

// Create/update database tables on every deploy
execSync("npx medusa db:migrate", { cwd: dir, stdio: "inherit" })

// Start Medusa and forward shutdown signals from PM2
const child = spawn("npx", ["medusa", "start"], { cwd: dir, stdio: "inherit" })
child.on("exit", (code) => process.exit(code ?? 1))
process.on("SIGTERM", () => child.kill("SIGTERM"))
process.on("SIGINT", () => child.kill("SIGINT"))
