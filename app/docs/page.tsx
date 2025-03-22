import { redirect } from "next/navigation"

/**
 * We can either show a welcome or simply redirect to /docs/overview.
 * Here, let's just redirect so that when the user visits /docs,
 * they're taken immediately to the Overview page.
 */
export default function DocsRootPage() {
  redirect("/docs/overview")
}