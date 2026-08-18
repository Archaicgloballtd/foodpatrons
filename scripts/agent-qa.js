// QA bot agent. Walks the real, live site as a handful of synthetic test
// accounts to catch real bugs (console errors, failed requests, broken
// flows) — then deletes everything it created (reservation, review,
// community post, newsletter signup) so nothing fake is ever left visible
// to real users or a real restaurant owner's dashboard. Test accounts are
// clearly tagged (profiles.is_test_account) and use a non-routable
// @foodpatrons-qa.internal email domain, never a real inbox.
//
// Usage: node scripts/agent-qa.js [--url=https://www.foodpatrons.com] [--headed]

const { chromium } = require("playwright");
const { createClient } = require("@supabase/supabase-js");
const { envVar } = require("./_env");

const supabase = createClient(envVar("NEXT_PUBLIC_SUPABASE_URL"), envVar("SUPABASE_SERVICE_ROLE_KEY"));

const urlArg = process.argv.find((a) => a.startsWith("--url="));
const BASE_URL = urlArg ? urlArg.split("=")[1] : "https://www.foodpatrons.com";
const HEADLESS = !process.argv.includes("--headed");
const BOT_PASSWORD = "QaBot!2026Foodpatrons";

const BOT = { email: "qa-bot-1@foodpatrons-qa.internal", fullName: "Rahim Uddin", phone: "01711000001" };

const findings = []; // { severity: 'bug'|'warning', step, detail }
const cleanupTasks = []; // functions to run at the end, always, regardless of what failed

function report(severity, step, detail) {
  findings.push({ severity, step, detail });
  console.log(`  [${severity.toUpperCase()}] ${step}: ${detail}`);
}

async function ensureBotAccount() {
  console.log(`Setting up bot account ${BOT.email}...`);
  const { data: existing } = await supabase.auth.admin.listUsers();
  let user = existing?.users.find((u) => u.email === BOT.email);

  if (!user) {
    const { data, error } = await supabase.auth.admin.createUser({
      email: BOT.email,
      password: BOT_PASSWORD,
      email_confirm: true,
      user_metadata: { full_name: BOT.fullName },
    });
    if (error) throw new Error(`Couldn't create bot account: ${error.message}`);
    user = data.user;
  }

  const { error: flagError } = await supabase
    .from("profiles")
    .update({ is_test_account: true, full_name: BOT.fullName })
    .eq("id", user.id);
  if (flagError) {
    // is_test_account doesn't exist until qa_bot_accounts.sql has run — not
    // fatal, the bot still works, it just won't be flagged in admin views yet.
    await supabase.from("profiles").update({ full_name: BOT.fullName }).eq("id", user.id);
    console.log("   (note: is_test_account column not found — run supabase/qa_bot_accounts.sql to enable that flag)");
  }
  return user.id;
}

async function pickTestRestaurant() {
  const { data, error } = await supabase
    .from("restaurants")
    .select("id, name")
    .eq("is_approved", true)
    .limit(1)
    .maybeSingle();
  if (error || !data) throw new Error("Couldn't find an approved restaurant to test against.");
  return data;
}

async function step(name, fn) {
  console.log(`\n-> ${name}`);
  try {
    await fn();
  } catch (err) {
    report("bug", name, err instanceof Error ? err.message : String(err));
  }
}

async function main() {
  const runStart = new Date().toISOString();
  const botUserId = await ensureBotAccount();
  const restaurant = await pickTestRestaurant();
  console.log(`Testing against: ${restaurant.name} (${restaurant.id})`);

  const browser = await chromium.launch({ headless: HEADLESS });
  const context = await browser.newContext({ baseURL: BASE_URL });
  const page = await context.newPage();

  page.on("pageerror", (err) => report("bug", "JS runtime error", err.message));
  page.on("console", (msg) => {
    // "Failed to load resource" duplicates what the response listener below
    // already reports with the actual URL and body — skip it here.
    if (msg.type() === "error" && !msg.text().includes("Failed to load resource")) {
      report("bug", "Browser console error", msg.text().slice(0, 300));
    }
  });
  page.on("requestfailed", (req) => {
    const failure = req.failure();
    // RSC prefetch requests aborted by navigating away before they finish
    // are normal Next.js behavior, not a bug — the URL param gives it away.
    if (failure && !(failure.errorText === "net::ERR_ABORTED" && req.url().includes("_rsc="))) {
      report("bug", "Failed network request", `${req.method()} ${req.url()} — ${failure.errorText}`);
    }
  });
  page.on("response", async (res) => {
    if (res.status() >= 400) {
      let bodySnippet = "";
      try {
        const text = await res.text();
        bodySnippet = text ? ` — body: ${text.slice(0, 200)}` : "";
      } catch {
        // response body not readable (e.g. redirected/streamed) — fine, report without it
      }
      report("bug", "HTTP error response", `${res.status()} ${res.request().method()} ${res.url()}${bodySnippet}`);
    }
  });

  try {
    await step("Load homepage", async () => {
      await page.goto("/", { waitUntil: "domcontentloaded", timeout: 20000 });
      await page.waitForTimeout(1500);
    });

    let signedIn = false;
    await step("Sign in as bot account", async () => {
      await page.goto("/login", { waitUntil: "domcontentloaded" });
      await page.getByLabel("Email").fill(BOT.email);
      await page.getByLabel("Password").fill(BOT_PASSWORD);
      await page.getByRole("button", { name: /sign in/i }).click();
      try {
        await page.getByText("Signed in as").waitFor({ timeout: 8000 });
        signedIn = true;
      } catch {
        const errorText = await page.locator("p.text-sm.text-red-600").textContent().catch(() => null);
        report("bug", "Sign in", errorText ? `Login failed with error: ${errorText}` : "No 'Signed in as' confirmation and no visible error message after submitting login.");
      }
    });

    await step("Search on Explore page", async () => {
      await page.goto("/explore", { waitUntil: "domcontentloaded" });
      const search = page.getByPlaceholder(/search food, restaurant/i);
      if (await search.count()) {
        await search.fill(restaurant.name);
        await page.waitForTimeout(1500);
      } else {
        report("warning", "Explore search", "Search box not found on /explore.");
      }
    });

    await step("Open restaurant profile", async () => {
      await page.goto(`/restaurant/${restaurant.id}`, { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1500);
      const heading = page.getByRole("heading", { name: restaurant.name });
      if (!(await heading.isVisible().catch(() => false))) {
        report("bug", "Restaurant profile", `Restaurant name heading not visible on its own profile page (${restaurant.id}).`);
      }
    });

    let reservationCode = null;
    await step("Make a reservation", async () => {
      const reserveButton = page.getByRole("button", { name: /reserve/i }).first();
      if (!(await reserveButton.count())) {
        report("warning", "Reservation", "No Reserve button found on restaurant profile.");
        return;
      }
      await reserveButton.click();
      await page.waitForTimeout(500);

      const tomorrow = new Date(Date.now() + 86400000).toISOString().slice(0, 10);
      await page.getByLabel("Date").fill(tomorrow);
      await page.getByLabel("Time").fill("19:00");
      await page.getByLabel("Name").fill(BOT.fullName);
      await page.getByLabel("Phone").fill(BOT.phone);
      await page.getByRole("button", { name: /request reservation/i }).click();

      try {
        await page.getByText("Reservation requested").waitFor({ timeout: 8000 });
        const codeLocator = page.locator("p.text-2xl.font-bold");
        reservationCode = (await codeLocator.first().textContent())?.trim() ?? null;
        if (reservationCode) {
          console.log(`   Reservation created: ${reservationCode}`);
          cleanupTasks.push(async () => {
            await supabase.from("reservations").delete().eq("code", reservationCode);
          });
        } else {
          report("bug", "Reservation", "Success screen appeared but no confirmation code text was found in it.");
        }
        await page.getByRole("button", { name: /done/i }).click();
      } catch {
        const errorText = await page.locator("p.text-sm.text-destructive").last().textContent().catch(() => null);
        report("bug", "Reservation", errorText ? `Submission failed with error: ${errorText}` : "Submission didn't reach the success screen within 8s, and no error message was visible.");
        // Whatever state the modal is in, close it via the X button so it
        // doesn't block the next step (e.g. intercepting clicks on the page behind it).
        await page.getByLabel("Close").click().catch(() => {});
      }
    });

    await step("Post a review", async () => {
      const writeReviewButton = page.getByRole("button", { name: /write a review/i });
      if (!(await writeReviewButton.count())) {
        report("warning", "Review", "No 'Write a review' button found on restaurant profile.");
        return;
      }
      await writeReviewButton.click();
      await page.waitForTimeout(500);
      await page.getByLabel("Rate 5 stars").click();
      await page.getByLabel("Your name").fill(BOT.fullName);
      await page.getByLabel(/comment/i).fill("Automated QA test review — should be deleted immediately by the bot's cleanup step.");
      await page.getByRole("button", { name: /post review/i }).click();
      await page.waitForTimeout(1500);

      cleanupTasks.push(async () => {
        await supabase.from("reviews").delete().eq("restaurant_id", restaurant.id).eq("customer_name", BOT.fullName).gte("created_at", runStart);
      });
    });

    await step("Post in community", async () => {
      if (!signedIn) {
        report("warning", "Community post", "Skipped — bot never got signed in earlier (see 'Sign in' finding).");
        return;
      }
      await page.goto("/community", { waitUntil: "domcontentloaded" });
      const composer = page.getByPlaceholder(/what's happening in dhaka/i);
      if (!(await composer.count())) {
        report("bug", "Community post", "Signed in successfully, but the post composer still isn't showing on /community.");
        return;
      }
      await composer.fill("Automated QA test post — should be deleted immediately by the bot's cleanup step.");
      await page.getByRole("button", { name: /^post$/i }).click();
      await page.waitForTimeout(1500);

      cleanupTasks.push(async () => {
        await supabase.from("posts").delete().eq("author_id", botUserId).gte("created_at", runStart);
      });
    });

    await step("Subscribe to newsletter", async () => {
      await page.goto("/", { waitUntil: "domcontentloaded" });
      await page.locator("footer").scrollIntoViewIfNeeded();
      const emailInput = page.locator('footer input[type="email"]');
      if (!(await emailInput.count())) {
        report("warning", "Newsletter", "Footer signup input not found.");
        return;
      }
      await emailInput.fill(BOT.email);
      await page.getByRole("button", { name: /subscribe/i }).click();
      await page.waitForTimeout(1000);

      cleanupTasks.push(async () => {
        await supabase.from("newsletter_subscribers").delete().eq("email", BOT.email);
      });
    });

    await step("Load guides page", async () => {
      await page.goto("/guides", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
    });

    await step("Check profile page and referral link", async () => {
      if (!signedIn) {
        report("warning", "Referral link", "Skipped — bot never got signed in earlier (see 'Sign in' finding).");
        return;
      }
      await page.goto("/profile", { waitUntil: "domcontentloaded" });
      await page.waitForTimeout(1000);
      const referralInput = page.locator('input[readonly]');
      if (!(await referralInput.count())) {
        report("bug", "Referral link", "Signed in successfully, but no referral link input is visible on the profile page.");
      }
    });

    await step("Sign out", async () => {
      if (!signedIn) {
        report("warning", "Sign out", "Skipped — bot never got signed in earlier.");
        return;
      }
      await page.getByRole("button", { name: /sign out/i }).click();
      await page.waitForTimeout(1000);
    });
  } finally {
    await browser.close();

    console.log(`\nCleaning up ${cleanupTasks.length} test record(s)...`);
    for (const task of cleanupTasks) {
      try {
        await task();
      } catch (err) {
        report("bug", "Cleanup", err instanceof Error ? err.message : String(err));
      }
    }
  }

  const bugs = findings.filter((f) => f.severity === "bug");
  const warnings = findings.filter((f) => f.severity === "warning");

  console.log("\n" + "=".repeat(60));
  console.log(`QA run complete against ${BASE_URL}`);
  console.log(`${bugs.length} bug(s), ${warnings.length} warning(s)`);
  console.log("=".repeat(60));
  if (findings.length === 0) {
    console.log("No issues found — every flow completed cleanly.");
  } else {
    for (const f of findings) console.log(`[${f.severity.toUpperCase()}] ${f.step}: ${f.detail}`);
  }
}

main().catch((err) => {
  console.error("QA run failed to complete:", err instanceof Error ? err.message : err);
  process.exit(1);
});
