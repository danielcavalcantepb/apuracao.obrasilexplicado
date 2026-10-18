'use client';
export default function ErrorPage({ reset }: { reset: () => void }) {
  return (
    <main className="container initial-loading">
      <p className="eyebrow">RESULTADOS BRASIL</p>
      <h1>
        Não foi possível
        <br />
        abrir o painel.
      </h1>
      <p>Tente novamente para consultar os dados oficiais.</p>
      <button className="retry-button" onClick={reset}>
        Tentar novamente
      </button>
    </main>
  );
}
