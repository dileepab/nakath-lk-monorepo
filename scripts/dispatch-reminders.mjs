const args = new Set(process.argv.slice(2))
const isDryRun = args.has("--dry-run")

const baseUrl = process.env.REMINDER_DISPATCH_URL || "http://localhost:3000"
const secret = process.env.REMINDER_DISPATCH_SECRET

if (!secret) {
  console.error("Missing REMINDER_DISPATCH_SECRET")
  process.exit(1)
}

const endpoint = new URL("/api/notifications/reminders/dispatch", baseUrl)
if (isDryRun) {
  endpoint.searchParams.set("dryRun", "true")
}

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "x-reminder-secret": secret,
  },
})

const payload = await response.text()

if (!response.ok) {
  console.error(payload)
  process.exit(1)
}

console.log(payload)
