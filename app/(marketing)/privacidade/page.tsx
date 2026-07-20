import Link from "next/link";

export const metadata = { title: "Política de Privacidade — Altamente Rentável Academy" };

// LGPD — política básica e honesta sobre o que a plataforma realmente
// coleta/faz. Evolui junto com o produto; texto revisável pelo Davi.
export default function PrivacidadePage() {
  return (
    <main className="fundo-grid" style={{ minHeight: "100vh", padding: "48px 6vw 80px" }}>
      <Link href="/" style={{ color: "var(--dusty-grey)", fontSize: 14 }}>← Voltar</Link>
      <h1 style={{ fontWeight: 800, fontSize: "clamp(28px, 4vw, 40px)", marginTop: 24 }}>
        Política de <span style={{ color: "var(--goldenrod)" }}>Privacidade</span>
      </h1>
      <div className="cartao" style={{ marginTop: 26, maxWidth: 780, lineHeight: 1.65, fontSize: 15 }}>
        <p style={{ color: "var(--dusty-grey)" }}>
          A Altamente Rentável Academy trata dados pessoais conforme a Lei Geral de
          Proteção de Dados (Lei 13.709/2018). Em resumo:
        </p>
        <ul style={{ marginTop: 14, paddingLeft: 20, color: "var(--off-white)", display: "grid", gap: 10 }}>
          <li>
            <strong>O que coletamos:</strong> seu e-mail (para criar o acesso e enviar o
            link de entrada) e os dados da compra (valor, data, método de pagamento).
          </li>
          <li>
            <strong>Pagamento:</strong> processado pela Stripe — não armazenamos número de
            cartão nem dados bancários nos nossos servidores.
          </li>
          <li>
            <strong>Para que usamos:</strong> liberar e manter seu acesso ao conteúdo
            comprado, salvar seu progresso de aula e dar suporte. Não vendemos nem
            compartilhamos seus dados com terceiros para marketing.
          </li>
          <li>
            <strong>Onde ficam:</strong> em infraestrutura da Supabase (banco com controle
            de acesso por linha) e da Stripe, sob os controles de segurança de cada uma.
          </li>
          <li>
            <strong>Seus direitos:</strong> você pode pedir acesso, correção ou exclusão
            dos seus dados a qualquer momento pelo e-mail de contato abaixo.
          </li>
          <li>
            <strong>Cookies:</strong> usamos apenas cookies/armazenamento essenciais de
            sessão (login) — sem rastreadores de publicidade.
          </li>
        </ul>
        <p style={{ color: "var(--dusty-grey)", marginTop: 16 }}>
          Contato do controlador: <span style={{ color: "var(--goldenrod)" }}>contato@altamenterentavel.com.br</span>{" "}
          (ajuste este canal se o e-mail oficial de suporte for outro).
        </p>
      </div>
    </main>
  );
}
