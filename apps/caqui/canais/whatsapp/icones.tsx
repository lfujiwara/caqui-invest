type Props = { className?: string };

export function Voltar({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="24" height="24" aria-hidden>
      <path fill="currentColor" d="M20 11H7.83l5.59-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z" />
    </svg>
  );
}

export function Verificado({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="16" height="16" aria-label="Conta verificada" role="img">
      <path
        fill="#2fb4a0"
        d="M12 1.5l2.4 1.9 3-.4 1.1 2.8 2.8 1.1-.4 3L22.5 12l-1.9 2.4.4 3-2.8 1.1-1.1 2.8-3-.4L12 22.5l-2.4-1.9-3 .4-1.1-2.8-2.8-1.1.4-3L1.5 12l1.9-2.4-.4-3 2.8-1.1 1.1-2.8 3 .4z"
      />
      <path fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" d="M7.5 12.3l3 3 6-6.2" />
    </svg>
  );
}

export function Menu({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <circle cx="12" cy="5" r="2" fill="currentColor" />
      <circle cx="12" cy="12" r="2" fill="currentColor" />
      <circle cx="12" cy="19" r="2" fill="currentColor" />
    </svg>
  );
}

export function Enviar({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="22" height="22" aria-hidden>
      <path fill="currentColor" d="M3.4 20.4l17.45-7.48a1 1 0 000-1.84L3.4 3.6a.99.99 0 00-1.39.91L2 9.12c0 .5.37.93.87.99L17 12 2.87 13.88c-.5.07-.87.5-.87 1l.01 4.61c0 .71.73 1.2 1.39.91z" />
    </svg>
  );
}

export function Responder({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="currentColor" d="M10 9V5l-7 7 7 7v-4.1c5 0 8.5 1.6 11 5.1-1-5-4-10-11-11z" />
    </svg>
  );
}

export function Lista({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="18" height="18" aria-hidden>
      <path fill="currentColor" d="M3 6h2v2H3zm4 0h14v2H7zm-4 5h2v2H3zm4 0h14v2H7zm-4 5h2v2H3zm4 0h14v2H7z" />
    </svg>
  );
}

export function Cadeado({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 24 24" width="12" height="12" aria-hidden>
      <path fill="currentColor" d="M18 8h-1V6A5 5 0 007 6v2H6a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V10a2 2 0 00-2-2zM9 6a3 3 0 016 0v2H9V6z" />
    </svg>
  );
}

export function Ticks({ className, lida }: Props & { lida: boolean }) {
  return (
    <svg className={className} viewBox="0 0 18 12" width="16" height="11" role="img" aria-label={lida ? "Lida" : "Entregue"}>
      <path fill="none" stroke={lida ? "#3a9fd8" : "#8696a0"} strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" d="M1.5 6.5l3 3 6.5-7.5M7.5 9.5l1 1 7-8.5" />
    </svg>
  );
}

export function Caqui({ className }: Props) {
  return (
    <svg className={className} viewBox="0 0 40 40" width="38" height="38" aria-hidden>
      <circle cx="20" cy="20" r="20" fill="#fde7cf" />
      <ellipse cx="20" cy="23" rx="11" ry="10" fill="#f07c22" />
      <ellipse cx="16.5" cy="20" rx="3" ry="2" fill="#f9a75a" opacity=".8" />
      <path fill="#4f7a3a" d="M20 13.5c-2.5-2.6-5.8-2.4-7.2-1.4 1.6.2 3.4 1 4.2 2.4-2 .1-3.4 1-3.8 2 2.3-.7 4.9-.5 6.8.3 1.9-.8 4.5-1 6.8-.3-.4-1-1.8-1.9-3.8-2 .8-1.4 2.6-2.2 4.2-2.4-1.4-1-4.7-1.2-7.2 1.4z" />
    </svg>
  );
}
