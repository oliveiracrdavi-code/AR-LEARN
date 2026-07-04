// Log com timestamp (HH:MM:SS, UTC) — usado nas chamadas de rede do
// pipeline pra saber exatamente qual serviço externo travou/demorou,
// em vez de só "o step X travou" sem detalhe de qual chamada.
export function logComTimestamp(mensagem: string): void {
  const agora = new Date().toISOString().slice(11, 19);
  console.log(`[${agora}] ${mensagem}`);
}
