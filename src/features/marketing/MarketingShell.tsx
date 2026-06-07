// Container interne commun aux pages marketing : centre + max-w-6xl + spacing
// vertical. La protection isAppShell et le rendu navbar/footer sont geres en
// amont par <MarketingLayout> (cf src/components/marketing/MarketingLayout.tsx).
export function MarketingShell({ children }: { children: React.ReactNode }) {
  return (
    <div className="mx-auto w-full max-w-6xl py-12 sm:py-16">
      {children}
    </div>
  )
}
