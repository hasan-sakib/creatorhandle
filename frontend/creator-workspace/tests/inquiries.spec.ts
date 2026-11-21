import { expect, test } from "@playwright/test"
import { createUser } from "./utils/privateApi.ts"
import { randomEmail, randomPassword } from "./utils/random"
import { logInUser } from "./utils/user"

// The public page lives at the site root, outside the dashboard's /app/ base
const SITE = new URL("/", "http://localhost:5173").toString()

test.describe("Inquiries", () => {
  test.use({ storageState: { cookies: [], origins: [] } })

  test("A visitor's message reaches the creator's inbox and becomes a project", async ({
    page,
  }) => {
    const email = randomEmail()
    const password = randomPassword()
    const handle = `e2e${Math.random().toString(36).slice(2, 10)}`
    await createUser({ email, password })

    // Publish a page
    await logInUser(page, email, password)
    const token = await page.evaluate(() =>
      localStorage.getItem("access_token"),
    )
    const publish = await page.request.patch(`${SITE}api/v1/users/me`, {
      headers: { Authorization: `Bearer ${token}` },
      data: { username: handle, is_published: true },
    })
    expect(publish.ok()).toBeTruthy()

    // A visitor (signed out) sends a message from the public page
    await page.evaluate(() => localStorage.removeItem("access_token"))
    await page.goto(`${SITE}@${handle}#contact`)
    await page.getByLabel("Your name").fill("Riley Partner")
    await page.getByLabel("Email").fill("riley@example.com")
    await page.getByLabel(/Company or brand/).fill("Northwind")
    await page.getByRole("button", { name: "$2k – $5k" }).click()
    await page
      .getByLabel("Message")
      .fill("Could we talk about a sponsored review next month?")
    await page.getByRole("button", { name: "Send message" }).click()
    await expect(page.getByText("Message sent")).toBeVisible()

    // The creator sees it in the inbox and converts it
    await logInUser(page, email, password)
    await page.goto("inbox")
    await expect(page.getByText("Riley Partner")).toBeVisible()
    await expect(page.getByText("New", { exact: true })).toBeVisible()
    await page.getByRole("button", { name: "Convert to project" }).click()
    await page.waitForURL("projects")
    await expect(page.getByText("Inquiry from Northwind")).toBeVisible()
  })
})
