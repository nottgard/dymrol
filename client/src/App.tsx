import { Routes, Route, Navigate } from 'react-router-dom';
import Home from './pages/Home/Home.tsx';
import HomeV2 from './pages/HomeV2/HomeV2.tsx';

export default function App() {
  return (
    <Routes>
      <Route index element={<Home />} />
      {/* Añade aquí tus nuevas secciones: <Route path="about" element={<About />} /> */}
      <Route path="v2" element={<HomeV2 />} />
      {/* Cualquier ruta que no exista va a la home (por ahora no hay 404) */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
