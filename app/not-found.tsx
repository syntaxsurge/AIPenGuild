import { LinkButton } from "@/components/ui/link-button"

export default function NotFoundError() {
  return (
    <div className="flex h-[70vh] w-full items-center justify-center">
      <div className="flex flex-col items-center gap-2 text-center">
        <h1 className="text-[7rem] font-bold leading-tight text-primary">404</h1>
        <span className="font-semibold text-xl">Uh oh, we can't find that page.</span>
        <p className="max-w-md text-muted-foreground">
          The link might be broken or the page may have been removed. Double-check your URL or try again later.
        </p>
        <div className="mt-6">
          <LinkButton href="/" variant="default">Return to Home</LinkButton>
        </div>
      </div>
    </div>
  )
}