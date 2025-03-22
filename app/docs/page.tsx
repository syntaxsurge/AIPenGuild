import { redirect } from "next/navigation"

export default function DocsRootPage() {
  // We keep the direct redirect to /docs/overview.
  redirect("/docs/overview")
  return null
}