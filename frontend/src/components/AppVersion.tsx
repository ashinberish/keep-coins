declare const __APP_VERSION__: string
declare const __APP_IS_DEV__: boolean

const GITHUB_REPO = "https://github.com/ashinberish/keep-coins"

export function AppVersion() {
  return (
    <span className="fixed right-3 bottom-3 flex items-center gap-2 text-xs text-muted-foreground/50 select-none">
      <a
        href={GITHUB_REPO}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-muted-foreground"
      >
        GitHub
      </a>
      <span>·</span>
      {__APP_IS_DEV__
        ? `local build v${__APP_VERSION__}`
        : `v${__APP_VERSION__}`}
    </span>
  )
}

export function AppVersionInline() {
  return (
    <span className="flex items-center gap-2 text-xs text-muted-foreground/50 select-none">
      <a
        href={GITHUB_REPO}
        target="_blank"
        rel="noopener noreferrer"
        className="transition-colors hover:text-muted-foreground"
      >
        GitHub
      </a>
      <span>·</span>
      {__APP_IS_DEV__
        ? `local build v${__APP_VERSION__}`
        : `v${__APP_VERSION__}`}
    </span>
  )
}
