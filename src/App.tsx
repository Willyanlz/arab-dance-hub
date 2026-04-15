import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider } from "@/hooks/useAuth";
import Index from "./pages/Index.tsx";
import Login from "./pages/Login.tsx";
import Inscricao from "./pages/Inscricao.tsx";
import Dashboard from "./pages/Dashboard.tsx";
import Admin from "./pages/Admin.tsx";
import AdminConfig from "./pages/AdminConfig.tsx";
import AdminIngressos from "./pages/AdminIngressos.tsx";
import Ingressos from "./pages/Ingressos.tsx";
import NotFound from "./pages/NotFound.tsx";
import UpdatePassword from "./pages/UpdatePassword.tsx";
import AdminScanner from "./pages/AdminScanner.tsx";
import { Navigate } from "react-router-dom";
import { ConfigInscricoes } from "./pages/admin-config/ConfigInscricoes";
import { ConfigPrecos } from "./pages/admin-config/ConfigPrecos";
import { FormulariosConfig } from "./pages/admin-config/FormulariosConfig";
import { ConfigTermos } from "./pages/admin-config/ConfigTermos";
import { ConfigWorkshops } from "./pages/admin-config/ConfigWorkshops";
import { ConfigIngressos } from "./pages/admin-config/ConfigIngressos";
import { ConfigStands } from "./pages/admin-config/ConfigStands";
import { ConfigEvento } from "./pages/admin-config/ConfigEvento";
import { AdminRoles } from "./pages/admin-config/AdminRoles";
import { FormBuilder } from "./pages/admin-config/components/FormBuilder";
import { ConfigEmailTemplate } from "./pages/admin-config/ConfigEmailTemplate";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <AuthProvider>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/login" element={<Login />} />
            <Route path="/inscricao" element={<Inscricao />} />
            <Route path="/ingressos" element={<Ingressos />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/admin/config" element={<AdminConfig />}>
              <Route index element={<Navigate to="geral" replace />} />
              <Route path="geral" element={<ConfigInscricoes />} />
              <Route path="precos" element={<ConfigPrecos />} />
              <Route path="formularios" element={<FormulariosConfig />}>
                <Route index element={<Navigate to="competicao" replace />} />
                <Route path="competicao" element={<FormBuilder tipo="competicao" title="Formulário: Competição" />} />
                <Route path="mostra" element={<FormBuilder tipo="mostra" title="Formulário: Mostra" />} />
                <Route path="workshop" element={<FormBuilder tipo="workshop" title="Formulário: Workshop" />} />
              </Route>
              <Route path="termos" element={<ConfigTermos />} />
              <Route path="workshops" element={<ConfigWorkshops />} />
              <Route path="ingressos" element={<ConfigIngressos />} />
              <Route path="stands" element={<ConfigStands />} />
              <Route path="landpage" element={<ConfigEvento />} />
              <Route path="admins" element={<AdminRoles />} />
            </Route>
            <Route path="/admin/ingressos" element={<AdminIngressos />} />
            <Route path="/admin/scanner" element={<AdminScanner />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </AuthProvider>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
