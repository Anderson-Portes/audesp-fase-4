import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from 'react-hot-toast';

import { AuthProvider } from './context/AuthContext';
import { ProtectedRoute } from './components/layout/ProtectedRoute';
import { Home } from './pages/Home';
import { Login } from './pages/Auth/Login';
import { EditaisList } from './pages/Edital/EditaisList';
import { EditalForm } from './pages/Edital/EditalForm';
import { LicitacoesList } from './pages/Licitacoes/LicitacoesList';
import { LicitacaoForm } from './pages/Licitacoes/LicitacaoForm';
import { AtasList } from './pages/Atas/AtasList';
import { AtaForm } from './pages/Atas/AtaForm';
import { AjustesList } from './pages/Ajustes/AjustesList';
import { AjusteForm } from './pages/Ajustes/AjusteForm';
import { ProtocolosList } from './pages/Protocolos/ProtocolosList';

const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <BrowserRouter>
          <Toaster position="top-right" />
          <Routes>
            <Route path="/login" element={<Login />} />
            
            <Route element={<ProtectedRoute />}>
              <Route path="/" element={<Home />} />
              <Route path="/editais" element={<EditaisList />} />
              <Route path="/editais/novo" element={<EditalForm />} />
              <Route path="/editais/:id" element={<EditalForm />} />
              <Route path="/licitacoes" element={<LicitacoesList />} />
              <Route path="/licitacoes/novo" element={<LicitacaoForm />} />
              <Route path="/licitacoes/:id" element={<LicitacaoForm />} />
              <Route path="/atas" element={<AtasList />} />
              <Route path="/atas/novo" element={<AtaForm />} />
              <Route path="/atas/:id" element={<AtaForm />} />
              <Route path="/ajustes" element={<AjustesList />} />
              <Route path="/ajustes/novo" element={<AjusteForm />} />
              <Route path="/ajustes/:id" element={<AjusteForm />} />
              <Route path="/protocolos" element={<ProtocolosList />} />
              <Route path="*" element={<Navigate to="/" replace />} />
            </Route>
          </Routes>
        </BrowserRouter>
      </AuthProvider>
    </QueryClientProvider>
  );
}


export default App;

