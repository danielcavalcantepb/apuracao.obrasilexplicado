import Link from 'next/link';
export function Brand() {
  return (
    <Link className="brand" href="/" aria-label="Resultados Brasil, início">
      <svg width="42" height="42" viewBox="0 0 42 42" fill="none" aria-hidden="true">
        <path d="M4 7h20l14 14-14 14H4V7Z" fill="currentColor" />
        <path d="m21 10 11 11-11 11-11-11 11-11Z" fill="#F5C518" />
        <circle cx="21" cy="21" r="5.5" fill="#123A6D" />
      </svg>
      <span>
        Resultados <b>Brasil</b>
        <small>ELEIÇÕES 2026</small>
      </span>
    </Link>
  );
}
