import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { GameLayout } from './layouts/GameLayout';
import { Dashboard } from './components/Dashboard';
import { Login } from './components/Login';
import { Signup } from './components/Signup';
import { ProtectedRoute } from './components/ProtectedRoute';

function App() {
    return (
        <BrowserRouter>
            <Routes>
                {/* Routes d'authentification */}
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />

                {/* Route principale avec le layout de jeu - protégée */}
                <Route
                    path="/"
                    element={
                        <ProtectedRoute>
                            <GameLayout />
                        </ProtectedRoute>
                    }
                />

                {/* Dashboard - réservé aux admins */}
                <Route
                    path="/dashboard"
                    element={
                        <ProtectedRoute requireAdmin={true}>
                            <Dashboard />
                        </ProtectedRoute>
                    }
                />

                {/* Redirige l'ancienne route vers la page principale */}
                <Route path="/character/create" element={<Navigate to="/" replace />} />

                {/* Route 404 - Redirige toute route inconnue vers la page principale */}
                <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
        </BrowserRouter>
    );
}

export default App;