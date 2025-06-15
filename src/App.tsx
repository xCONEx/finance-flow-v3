
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "./contexts/AuthContext";
import { SupabaseAuthProvider } from "./contexts/SupabaseAuthContext";
import { ThemeProvider } from "./contexts/ThemeContext";
import { PrivacyProvider } from "./contexts/PrivacyContext";
import { AppProvider } from "./contexts/AppContext";
import Index from "./pages/Index";
import LoginPage from "./components/LoginPage";
import Migration from "./pages/Migration";
import NotFound from "./pages/NotFound";
import ProtectedRoute from "./components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <AuthProvider>
        <SupabaseAuthProvider>
          <ThemeProvider>
            <PrivacyProvider>
              <AppProvider>
                <Toaster />
                <Sonner />
                <BrowserRouter>
                  <Routes>
                    <Route path="/login" element={<LoginPage />} />
                    <Route path="/migration" element={
                      <ProtectedRoute>
                        <Migration />
                      </ProtectedRoute>
                    } />
                    <Route path="/" element={
                      <ProtectedRoute>
                        <Index />
                      </ProtectedRoute>
                    } />
                    <Route path="*" element={<NotFound />} />
                  </Routes>
                </BrowserRouter>
              </AppProvider>
            </PrivacyProvider>
          </ThemeProvider>
        </SupabaseAuthProvider>
      </AuthProvider>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
