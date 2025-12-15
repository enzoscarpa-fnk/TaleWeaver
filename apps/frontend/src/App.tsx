import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameLayout } from './layouts/GameLayout';
import { Dashboard } from './components/Dashboard';
import { CharacterCreationChat } from './components/CharacterCreation/CharacterCreationChat';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Route principale avec le layout de jeu */}
                <Route path="/" element={<GameLayout />} />

                {/* Dashboard */}
                <Route path="/dashboard" element={<Dashboard />} />

                {/* Création de personnage plein écran */}
                <Route path="/character/create" element={<CharacterCreationChat />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
