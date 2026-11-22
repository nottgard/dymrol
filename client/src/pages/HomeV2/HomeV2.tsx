import FireBackground from '../../components/FireBackground/FireBackground.tsx';
import HammerCounter from '../../components/HammerCounterV2/HammerCounter.tsx';
import Logo from '../../components/Logo/Logo.tsx';
import SocialBar from '../../components/SocialBar/SocialBar.tsx';
import SoundToggle from '../../components/SoundToggle/SoundToggle.tsx';
import './Home.css';

export default function HomeV2() {
  return (
    <>
      <FireBackground />

      <div className="home">
        <main className="home__content">
          <Logo />
          <p className="home__text">
            <span>Estamos forjando algo...</span>
            <span className="home__text--soft">
              ¡Ayúdanos en la forja con tu martillo!
            </span>
          </p>

          <HammerCounter />
        </main>
      </div>

      <SocialBar />
      <SoundToggle />
    </>
  );
}
