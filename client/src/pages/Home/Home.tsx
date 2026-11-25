import FireBackground from '../../components/FireBackground/FireBackground.tsx';
import NightSky from '../../components/NightSky/NightSky.tsx';
import HammerCounter from '../../components/HammerCounterV2/HammerCounter.tsx';
import Logo from '../../components/Logo/Logo.tsx';
import SocialBar from '../../components/SocialBar/SocialBar.tsx';
import SoundToggle from '../../components/SoundToggle/SoundToggle.tsx';

export default function Home() {
  return (
    <>
      <FireBackground />
      {/* <NightSky /> */}

      <div className="fixed inset-0 overflow-y-auto overflow-x-hidden [scrollbar-gutter:stable] cursor-none [&_*]:cursor-none">
        <main className="relative z-1 w-full min-h-full flex flex-col items-center justify-between gap-[clamp(0.5rem,1.5vh,1.25rem)] pt-[clamp(0.75rem,2vh,1.5rem)] px-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] text-center select-none animate-emerge">
          <Logo />
          <p className="m-0 font-rocker font-light text-[clamp(1.25rem,1.4rem,1.75rem)] leading-[1.45] tracking-[0.01em] text-text [@media(hover:none)_and_(pointer:coarse)]:font-cormorant [@media(hover:none)_and_(pointer:coarse)]:text-[clamp(1.4rem,1.49rem,1.8rem)]">
            <span className="block">Estamos forjando algo...</span>
            <span className="block font-germania italic text-muted mt-[0.35em]">
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
