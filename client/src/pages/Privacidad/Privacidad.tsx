import SocialBar from '../../components/SocialBar/SocialBar.tsx';
import Logo from '../../components/Logo/Logo.tsx';

export default function Privacidad() {
    return (<>
    <main className="relative z-1 w-full min-h-full flex flex-col items-center justify-between gap-[clamp(0.5rem,1.5vh,1.25rem)] pt-[clamp(0.75rem,2vh,1.5rem)] px-6 pb-[calc(4.5rem+env(safe-area-inset-bottom,0px))] text-center select-none animate-emerge">
    <Logo />
    <div className='grid grid-cols-1 ml-10 mr-10 mt-10'>
    <div className='text-justify'>
        <h1>Estadísticas de uso anónimas</h1>
&nbsp;
<p>Este sitio web recopila métricas básicas de tráfico (páginas visitadas, hora de acceso y recuento diario de visitas únicas y recurrentes) mediante un sistema propio que anonimiza de forma irreversible la dirección IP mediante un identificador aleatorio diario no reversible y sin utilizar cookies ni almacenamiento en el dispositivo del usuario. Al tratarse de información estrictamente anónima y agregada, no permite identificar a ninguna persona ni realizar seguimiento entre días distintos.</p>
    </div>
    </div>
    </main>
    <SocialBar />
    </>
    )
}
