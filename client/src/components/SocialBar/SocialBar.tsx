import type { CSSProperties } from 'react';
import { socialLinks } from './socialLinks.ts';

export default function SocialBar() {
  return (
    <nav
      className="fixed z-2 inset-x-0 bottom-[calc(0.75rem+env(safe-area-inset-bottom,0px))] py-2.5 pointer-events-none"
      aria-label="Redes sociales"
    >
      <ul className="list-none m-auto p-0 flex flex-wrap justify-center gap-x-2 gap-y-1 max-w-160">
        {socialLinks.map(({ name, href, path, color }) => (
          <li key={name}>
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="pointer-events-auto size-8 grid place-items-center text-white/70 [filter:drop-shadow(0_0_6px_rgba(0,0,0,0.6))] transition-[color,transform,filter] duration-200 ease-in-out [-webkit-tap-highlight-color:transparent] hover:text-(--brand-color) hover:-translate-y-0.5 hover:[filter:drop-shadow(0_0_8px_var(--brand-color))] focus-visible:outline-2 focus-visible:outline-(--brand-color) focus-visible:outline-offset-2 focus-visible:rounded-md"
              aria-label={name}
              title={name}
              style={{ '--brand-color': color } as CSSProperties}
            >
              <svg className="size-5.5 fill-current" viewBox="0 0 24 24" aria-hidden="true">
                <path d={path} />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
