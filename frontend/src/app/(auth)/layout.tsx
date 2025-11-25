export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-4">
      <div className="w-full max-w-md">
        {/* Logo */}
        <div className="mb-8 flex flex-col items-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-primary">
            <span className="text-lg font-bold text-primary-foreground">ZE</span>
          </div>
          <h1 className="mt-4 text-2xl font-semibold">Zero Evaluation</h1>
          <p className="mt-1 text-sm text-muted-foreground">Personal Development Tracking</p>
        </div>

        {/* Auth content */}
        {children}
      </div>
    </div>
  );
}
