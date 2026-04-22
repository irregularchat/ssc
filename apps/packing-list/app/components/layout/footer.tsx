export function Footer() {
  return (
    <footer className="hidden md:block border-t border-border py-6 mt-auto">
      <div className="container mx-auto px-4">
        <div className="flex items-center justify-center gap-2 text-text-muted text-sm">
          <span>Community Packing List</span>
          <span>·</span>
          <span>{new Date().getFullYear()}</span>
        </div>
      </div>
    </footer>
  )
}
