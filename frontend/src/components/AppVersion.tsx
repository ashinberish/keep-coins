declare const __APP_VERSION__: string
declare const __APP_COMMIT__: string
declare const __APP_IS_DEV__: boolean

export function AppVersion() {
  return (
    <span className="fixed right-3 bottom-3 text-xs text-muted-foreground/50 select-none">
      {__APP_IS_DEV__
        ? `local build v${__APP_VERSION__}`
        : `v${__APP_VERSION__}`}
    </span>
  )
}
