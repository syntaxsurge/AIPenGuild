'use client'

import Link from "next/link";

export default function ForbiddenPage() {
  return (
    <div className="flex h-[70vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[7rem] font-bold leading-tight text-primary">403</h1>
        <span className="font-semibold text-xl">
          Oops! You don't have permission to view this page.
        </span>
        <p className="max-w-md text-muted-foreground">
          If you believe this is in error, please contact the site administrator.
        </p>
        <div className="mt-6">
          <Link
            href="/"
            className="inline-block rounded-md border border-primary bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:bg-primary/80"
          >
            Return to Home
          </Link>
        </div>
      </div>
    </div>
  );
}