export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-background px-4">
      {/* Glows decorativos */}
      <div className="pointer-events-none absolute -top-32 right-1/4 h-72 w-72 rounded-full bg-brand/10 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-32 left-1/4 h-72 w-72 rounded-full bg-primary/5 blur-3xl" />
      <div className="relative w-full max-w-md">{children}</div>
    </div>
  );
}
