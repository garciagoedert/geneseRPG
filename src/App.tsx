import { BrowserRouter, Routes, Route } from 'react-router-dom';
import LoginPage from './pages/LoginPage';
import RegisterPage from './pages/RegisterPage';
import MesaPage from './pages/MesaPage';
import CreateCharacterPage from './pages/CreateCharacterPage';
import CharacterListPage from './pages/CharacterListPage';
import MapPage from './pages/MapPage';
import MapsListPage from './pages/MapsListPage';
import MapDetailsPage from './pages/MapDetailsPage';
import CharacterSheetPage from './pages/CharacterSheetPage';
import EditCharacterPage from './pages/EditCharacterPage';
import GMViewPage from './pages/GMViewPage';
import BestiaryPage from './pages/BestiaryPage';
import AddCreaturePage from './pages/AddCreaturePage';
import EditCreaturePage from './pages/EditCreaturePage';
import CreatureDetailPage from './pages/CreatureDetailPage';
import SpellsPage from './pages/SpellsPage';
import AddSpellPage from './pages/AddSpellPage';
import EditSpellPage from './pages/EditSpellPage';
import SpellDetailPage from './pages/SpellDetailPage';
import ItemsPage from './pages/ItemsPage';
import AddItemPage from './pages/AddItemPage';
import EditItemPage from './pages/EditItemPage';
import ItemDetailPage from './pages/ItemDetailPage';
import WikiPage from './pages/WikiPage';
import AddWikiEntryPage from './pages/AddWikiEntryPage';
import EditWikiEntryPage from './pages/EditWikiEntryPage';
import WikiEntryDetailPage from './pages/WikiEntryDetailPage';
import ProtectedRoute from './components/ProtectedRoute';
import Layout from './components/Layout';
import ScrollToTop from './components/ScrollToTop';

function App() {
  return (
    <BrowserRouter>
      <ScrollToTop />
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
                <MesaPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/character-list"
          element={
            <ProtectedRoute>
              <Layout>
                <CharacterListPage />
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
          path="/maps"
          element={
            <ProtectedRoute>
              <Layout>
                <MapsListPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/map/:mapId"
          element={
            <ProtectedRoute>
              <Layout>
                <MapPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/map-details/:mapId"
          element={
            <ProtectedRoute>
              <Layout>
                <MapDetailsPage />
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
        <Route
          path="/bestiary"
          element={
            <ProtectedRoute>
              <Layout>
                <BestiaryPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-creature"
          element={
            <ProtectedRoute>
              <Layout>
                <AddCreaturePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-creature/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <EditCreaturePage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/creature/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <CreatureDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/spells"
          element={
            <ProtectedRoute>
              <Layout>
                <SpellsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-spell"
          element={
            <ProtectedRoute>
              <Layout>
                <AddSpellPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-spell/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <EditSpellPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/spell/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <SpellDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/items"
          element={
            <ProtectedRoute>
              <Layout>
                <ItemsPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-item"
          element={
            <ProtectedRoute>
              <Layout>
                <AddItemPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-item/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <EditItemPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/item/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <ItemDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wiki"
          element={
            <ProtectedRoute>
              <Layout>
                <WikiPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/add-wiki-entry"
          element={
            <ProtectedRoute>
              <Layout>
                <AddWikiEntryPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/edit-wiki-entry/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <EditWikiEntryPage />
              </Layout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/wiki/:id"
          element={
            <ProtectedRoute>
              <Layout>
                <WikiEntryDetailPage />
              </Layout>
            </ProtectedRoute>
          }
        />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
