# Système d'Authentification - TaleWeaver

Ce document explique comment utiliser le système d'authentification de TaleWeaver.

## Fonctionnalités

- ✅ Création de compte utilisateur
- ✅ Connexion avec email et mot de passe
- ✅ Gestion des rôles (USER, ADMIN)
- ✅ Protection des routes (dashboard réservé aux admins)
- ✅ Gestion des cookies de session (supprimés à la fermeture du navigateur pour les invités)
- ✅ Déconnexion

## Backend

### Structure

Le système d'authentification backend est composé de :

- **Module Auth** (`apps/backend/src/auth/`)
  - Service d'authentification (`auth.service.ts`)
  - Contrôleur d'authentification (`auth.controller.ts`)
  - Guards pour la protection des routes (`guards/`)
  - Stratégies Passport (`strategies/`)
  - DTOs pour la validation (`dto/`)

- **Module Admin** (`apps/backend/src/admin/`)
  - Service admin (`admin.service.ts`)
  - Contrôleur admin (`admin.controller.ts`)

### Endpoints API

#### Authentification

- `POST /auth/signup` - Créer un compte
  - Body: `{ email: string, password: string }`
  - Retourne: `{ user: User }`
  - Crée automatiquement une session

- `POST /auth/login` - Se connecter
  - Body: `{ email: string, password: string }`
  - Retourne: `{ user: User }`
  - Crée automatiquement une session

- `GET /auth/me` - Obtenir l'utilisateur actuel
  - Requiert: Authentification (cookie sessionToken)
  - Retourne: `{ user: User }`

- `POST /auth/logout` - Se déconnecter
  - Supprime la session et le cookie

#### Administration (réservé aux admins)

- `GET /api/admin/users` - Liste tous les utilisateurs
- `GET /api/admin/users/:id` - Obtenir un utilisateur par ID
- `PATCH /api/admin/users/:id/role` - Modifier le rôle d'un utilisateur
  - Body: `{ role: 'USER' | 'ADMIN' }`
- `DELETE /api/admin/users/:id` - Supprimer un utilisateur

#### Dashboard (réservé aux admins)

- `GET /api/chat/stats/total` - Statistiques totales
- `GET /api/chat/stats/by-model` - Statistiques par modèle
- `GET /api/chat/stats/daily` - Statistiques quotidiennes

### Créer un utilisateur admin

Pour créer un utilisateur administrateur :

```bash
cd apps/backend
pnpm create-admin [email] [password]
```

Exemple :
```bash
pnpm create-admin admin@example.com admin123
```

Par défaut, si aucun argument n'est fourni, crée :
- Email: `admin@taleweaver.com`
- Password: `admin123`

## Frontend

### Structure

Le système d'authentification frontend est composé de :

- **Service Auth** (`apps/frontend/src/services/auth.service.ts`)
  - Méthodes pour interagir avec l'API d'authentification

- **Contexte Auth** (`apps/frontend/src/contexts/AuthContext.tsx`)
  - Gère l'état d'authentification global
  - Fournit `useAuth()` hook

- **Pages**
  - `Login` (`apps/frontend/src/components/Login.tsx`)
  - `Signup` (`apps/frontend/src/components/Signup.tsx`)

- **Protection des routes**
  - `ProtectedRoute` (`apps/frontend/src/components/ProtectedRoute.tsx`)
  - Utilisé pour protéger les routes nécessitant une authentification

### Routes

- `/login` - Page de connexion
- `/signup` - Page de création de compte
- `/dashboard` - Dashboard (protégé, admin uniquement)
- `/` - Page principale (accessible à tous)

### Utilisation

#### Dans un composant

```tsx
import { useAuth } from '../contexts/AuthContext';

function MyComponent() {
    const { user, login, logout, isAdmin } = useAuth();

    if (!user) {
        return <div>Non connecté</div>;
    }

    return (
        <div>
            <p>Connecté en tant que : {user.email}</p>
            {isAdmin && <p>Vous êtes administrateur</p>}
            <button onClick={logout}>Déconnexion</button>
        </div>
    );
}
```

#### Protection d'une route

```tsx
<Route
    path="/dashboard"
    element={
        <ProtectedRoute requireAdmin={true}>
            <Dashboard />
        </ProtectedRoute>
    }
/>
```

## Sécurité

### Cookies

Les cookies de session sont configurés avec :
- `httpOnly: true` - Protège contre les attaques XSS
- `secure: true` en production - Requiert HTTPS
- `sameSite: 'lax'` - Protection CSRF
- Pas de `maxAge` - Cookie de session (supprimé à la fermeture du navigateur)

### Hash des mots de passe

Les mots de passe sont hashés avec bcrypt (10 rounds).

### Sessions

Les sessions sont stockées en base de données avec :
- Token unique généré aléatoirement
- Date d'expiration (7 jours)
- Suppression automatique des sessions expirées

## Migration de la base de données

Après avoir mis à jour le schéma Prisma, exécutez :

```bash
cd apps/backend
pnpm prisma migrate dev
pnpm prisma generate
```

## Configuration

### Variables d'environnement

Backend (optionnel) :
- `SESSION_SECRET` - Secret pour les sessions (par défaut: 'taleweaver-secret-key-change-in-production')
- `NODE_ENV` - Environnement (development/production)

Frontend (optionnel) :
- `VITE_API_URL` - URL de l'API backend (par défaut: 'http://localhost:3001')

## Notes

- Les utilisateurs créés via `/auth/signup` ont le rôle `USER` par défaut
- Seuls les administrateurs peuvent accéder au dashboard et gérer les utilisateurs
- Les cookies sont automatiquement envoyés avec les requêtes axios grâce à `withCredentials: true`
- Les routes protégées redirigent vers `/login` si l'utilisateur n'est pas authentifié


