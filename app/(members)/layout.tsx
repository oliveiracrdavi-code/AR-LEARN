export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // TODO (Fase de Auth): validar sessão Supabase e compra aprovada
  // antes de renderizar a área de membros.
  return <>{children}</>;
}
