import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameLayout } from './layouts/GameLayout';
import { Dashboard } from './components/Dashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Route principale avec le layout de jeu */}
                <Route path="/" element={<GameLayout />} />

                {/* Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Redirige l'ancienne route vers la page principale */}
                <Route path="/character/create" element={<Navigate to="/" replace />} />

                {/* Route 404 - Redirige toute route inconnue vers la page principale */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;