import { Routes, Route, Navigate } from 'react-router-dom';
import Privacidad from './pages/Privacidad/Privacidad.tsx';
import Home from './pages/Home/Home.tsx';

export default function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      {/* Añade aquí tus nuevas secciones: <Route path="about" element={<About />} /> */}
      <Route path="politica-de-privacidad" element={<Privacidad />} />  
      {/* Cualquier ruta que no exista va a la home (por ahora no hay 404) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
