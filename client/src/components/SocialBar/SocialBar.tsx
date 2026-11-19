import { socialLinks } from './socialLinks.ts';
import './SocialBar.css';

export default function SocialBar() {
  return (
    <nav className="socials" aria-label="Redes sociales">
      <ul>
        {socialLinks.map(({ name, href, path }) => (
          <li key={name}>
            <a href={href} target="_blank" rel="noopener noreferrer" aria-label={name} title={name}>
              <svg viewBox="0 0 24 24" aria-hidden="true">
                <path d={path} />
              </svg>
            </a>
          </li>
        ))}
      </ul>
    </nav>
  );
}
