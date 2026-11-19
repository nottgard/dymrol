import FireBackground from '../../components/FireBackground/FireBackground.tsx';
import Logo from '../../components/Logo/Logo.tsx';
import SocialBar from '../../components/SocialBar/SocialBar.tsx';
import SoundToggle from '../../components/SoundToggle/SoundToggle.tsx';
import './Home.css';

export default function Home() {
  return (
    <div className="home">
      <FireBackground />

      <main className="home__content">
        <Logo />
        <p className="home__text">
          <span>Estamos forjando algo...</span>
          <span className="home__text--soft">
            ¡Ayúdanos en la forja con tu martillo!
          </span>
        </p>
      </main>

      <SocialBar />
      <SoundToggle />
    </div>
  );
}
