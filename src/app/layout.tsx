import type { Metadata } from 'next';
import './globals.css';
export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'http://localhost:3000'),
  title: 'Resultados Brasil — Eleições 2026',
  description:
    'Acompanhe a apuração para Presidente da República nas Eleições 2026 com dados oficiais fornecidos pelo TSE. Painel independente.',
  openGraph: {
    title: 'Resultados Brasil — Eleições 2026',
    description: 'Cada voto. O Brasil inteiro. Apuração presidencial com dados oficiais do TSE.',
    locale: 'pt_BR',
    type: 'website',
  },
  robots: { index: true, follow: true },
};
export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body>
        <a className="skip-link" href="#conteudo">
          Pular para o conteúdo
        </a>
        {children}
      </body>
    </html>
  );
}
