import { notFound } from "next/navigation";
import { VitrinePreviewCliente } from "./VitrinePreviewCliente";

export const dynamic = "force-dynamic";

// Rota de QA visual da vitrine (dados fictícios de UI, zero banco).
// Só existe quando VITRINE_PREVIEW=1 no ambiente — em produção é 404.
export default function DevVitrinePage() {
  if (process.env.VITRINE_PREVIEW !== "1") notFound();
  return <VitrinePreviewCliente />;
}
