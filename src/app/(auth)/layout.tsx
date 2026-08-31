export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex min-h-dvh flex-col">
      <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-10">
        <div className="mb-8">
          <p className="font-display text-2xl font-extrabold tracking-tight">TrainFlow</p>
          <p className="text-muted-foreground text-sm">Entrena con un plan. Registra cada serie.</p>
        </div>
        {children}
      </main>
    </div>
  );
}
