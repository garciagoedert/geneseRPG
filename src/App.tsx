import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import DashboardPage from './pages/DashboardPage';
import CreateCharacterPage from './pages/CreateCharacterPage';
import MapPage from './pages/MapPage';
import CharacterSheetPage from './pages/CharacterSheetPage';
import EditCharacterPage from './pages/EditCharacterPage';
import GMViewPage from './pages/GMViewPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Rotas Públicas */}
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/" element={<LoginPage />} />

        {/* Rotas Protegidas dentro do Layout */}
        <Route
          path="/dashboard"
          element={
            <ProtectedRoute>
              <Layout>
                <DashboardPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/create-character"
          element={
            <ProtectedRoute>
              <Layout>
                <CreateCharacterPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/map"
          element={
            <ProtectedRoute>
              <Layout>
                <MapPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/character/:sheetId"
          element={
            <ProtectedRoute>
              <Layout>
                <CharacterSheetPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-character/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <EditCharacterPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/gm-view"
          element={
            <ProtectedRoute>
              <Layout>
                <GMViewPage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
