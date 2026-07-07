import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";
import { FONTE } from "./tokens";

// Poppins (geométrica arredondada) self-hosted em public/fonts, 5 pesos,
// carregada via FontFace API com delayRender — determinístico no CI.
const PESOS = [400, 500, 600, 700, 800];
export function usePoppins(): void {
  const [handle] = useState(() => delayRender("carregando Poppins"));
  useEffect(() => {
    Promise.all(
      PESOS.map((w) => {
        const f = new FontFace(FONTE, `url(${staticFile(`fonts/poppins-${w}.woff2`)}) format('woff2')`, {
          weight: String(w),
        });
        return f.load().then((ff) => document.fonts.add(ff));
      })
    )
      .then(() => continueRender(handle))
      .catch(() => continueRender(handle));
  }, [handle]);
}
