import { useEffect, useState } from "react";
import { continueRender, delayRender, staticFile } from "remotion";

// Fonte de título: Anton (condensada, pesada, display) — self-hosted em
// public/fonts para render DETERMINÍSTICO no CI (mesma lição do "zero emoji
// de fonte": nada depende de fonte do sistema). Carrega via FontFace API e
// segura o render (delayRender) até estar pronta.
export const FONTE_TITULO = "Anton AR";

export function useFonteTitulo(): void {
  const [handle] = useState(() => delayRender("carregando fonte Anton"));
  useEffect(() => {
    const face = new FontFace(
      FONTE_TITULO,
      `url(${staticFile("fonts/anton.woff2")}) format('woff2')`
    );
    face
      .load()
      .then((f) => {
        document.fonts.add(f);
        continueRender(handle);
      })
      .catch(() => continueRender(handle));
  }, [handle]);
}
