import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './contexts/AuthContext';
import { QuoteProvider } from './contexts/QuoteContext';
import { CategoryProvider } from './contexts/CategoryContext';
import { OperationProvider } from './contexts/OperationContext';
import { ContractProvider } from './contexts/ContractContext';
import { ContainerProvider } from './contexts/ContainerContext';
import { DeliveryProvider } from './contexts/DeliveryContext';
import { ProtectedRoute } from './components/ProtectedRoute';
import { PublicQuote } from './pages/PublicQuote';
import { AdminLogin } from './pages/AdminLogin';
import { AdminDashboard } from './pages/AdminDashboard';
import { ForgotPassword } from './pages/ForgotPassword';
import { ResetPassword } from './pages/ResetPassword';
import ContractDetails from './components/contracts/ContractDetails';
import PublicContractSigning from './pages/PublicContractSigning';
import ContainerCreate from './pages/ContainerCreate';

function App() {
  return (
    <AuthProvider>
      <OperationProvider>
        <CategoryProvider>
          <QuoteProvider>
            <ContractProvider>
              <ContainerProvider>
                <DeliveryProvider>
                  <Router>
                    <Routes>
                      <Route path="/" element={<PublicQuote />} />
                      <Route path="/login" element={<AdminLogin />} />
                      <Route path="/forgot-password" element={<ForgotPassword />} />
                      <Route path="/reset-password" element={<ResetPassword />} />
                      <Route path="/public/sign/:signingLink" element={<PublicContractSigning />} />
                      <Route
                        path="/admin"
                        element={
                          <ProtectedRoute>
                            <AdminDashboard />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/containers"
                        element={
                          <ProtectedRoute>
                            <AdminDashboard initialTab="containers" />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/admin/containers/new"
                        element={
                          <ProtectedRoute>
                            <ContainerCreate />
                          </ProtectedRoute>
                        }
                      />
                      <Route
                        path="/contracts/:contractId"
                        element={
                          <ProtectedRoute>
                            <ContractDetails />
                          </ProtectedRoute>
                        }
                      />
                      <Route path="*" element={<Navigate to="/" replace />} />
                    </Routes>
                  </Router>
                </DeliveryProvider>
              </ContainerProvider>
            </ContractProvider>
          </QuoteProvider>
        </CategoryProvider>
      </OperationProvider>
    </AuthProvider>
  );
}

export default App;