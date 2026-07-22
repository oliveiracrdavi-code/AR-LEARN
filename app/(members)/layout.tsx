// A validação de sessão/compra NÃO acontece aqui de propósito: cada
// página do grupo (dashboard, learns/[slug]) já se protege via
// useSessao() + RLS na consulta a `learns` (RLS = fonte de verdade,
// não a UI) e revalida no /api/learns/[slug]/ativos antes de assinar
// qualquer URL. Um gate aqui seria redundante e não pode substituir
// o RLS de qualquer forma.
export default function MembersLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
