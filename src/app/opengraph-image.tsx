import { ImageResponse } from 'next/og';
export const alt = 'Resultados Brasil — Eleições 2026';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';
export default function Image() {
  return new ImageResponse(
    (
      <div
        style={{
          background: '#074C2B',
          color: 'white',
          display: 'flex',
          flexDirection: 'column',
          padding: '80px',
          width: '100%',
          height: '100%',
        }}
      >
        <div style={{ display: 'flex', fontSize: 28, color: '#F5C518' }}>
          RESULTADOS BRASIL · ELEIÇÕES 2026
        </div>
        <div style={{ display: 'flex', fontSize: 88, marginTop: 70 }}>Cada voto.</div>
        <div style={{ display: 'flex', fontSize: 88 }}>O Brasil inteiro.</div>
        <div style={{ display: 'flex', fontSize: 24, marginTop: 40 }}>
          Presidente da República · Dados oficiais do TSE · Painel independente
        </div>
      </div>
    ),
    size,
  );
}
