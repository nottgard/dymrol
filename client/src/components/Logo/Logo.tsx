import { Link } from 'react-router-dom';

// El contenedor y la imagen comparten estilo (igual que antes con la clase .logo)
const LOGO = 'w-[clamp(120px,23vw,80vh)] text-text [transform:rotate(-1deg)] animate-logo transition-[filter] duration-300 [@media(hover:none)_and_(pointer:coarse)]:w-[clamp(18rem,30vw,22rem)]';

export default function Logo() {
  return (
    <Link to="/" className="block cursor-pointer logo">
      <div className={LOGO} role="img" aria-label="DyM">
        <img
          className={`${LOGO} w-full! h-auto block [filter:drop-shadow(0_0_18px_rgba(255,110,30,0.25))]`}
          src="/assets/logoDyM.svg"
          alt="DyM – volver a la portada"
        />
      </div>
    </Link>
  );
}
