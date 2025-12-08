import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { GameLayout } from './layouts/GameLayout';
import { Dashboard } from './components/Dashboard';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                <Route path="/" element={<GameLayout />} />
                <Route path="/dashboard" element={<Dashboard />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;
