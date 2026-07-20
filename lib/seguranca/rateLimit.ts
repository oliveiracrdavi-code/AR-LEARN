// Rate limit simples por IP, em memória (janela deslizante). Proteção
// básica contra força bruta/spam nas rotas sensíveis (login do admin,
// checkout). Limitação conhecida e documentada no security-audit-log:
// em serverless cada instância tem o próprio Map — é um teto por
// instância, não global. Suficiente como primeira linha; evolução
// futura: um contador compartilhado se algum abuso real aparecer.
type Janela = { inicio: number; usos: number };

const janelas = new Map<string, Janela>();
const MAX_CHAVES = 10_000; // teto de memória

export function permitido(
  chave: string,
  maxUsos: number,
  janelaMs: number
): boolean {
  const agora = Date.now();
  const j = janelas.get(chave);

  if (!j || agora - j.inicio > janelaMs) {
    if (janelas.size >= MAX_CHAVES) janelas.clear();
    janelas.set(chave, { inicio: agora, usos: 1 });
    return true;
  }

  j.usos += 1;
  return j.usos <= maxUsos;
}

export function ipDaRequisicao(headers: Headers): string {
  return (
    headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
    headers.get("x-real-ip") ||
    "desconhecido"
  );
}
