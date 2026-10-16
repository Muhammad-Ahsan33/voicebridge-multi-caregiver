import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "./context/AuthContext";
import { ToastProvider } from "./components/Toast";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginPage from "./routes/LoginPage";
import RegisterPage from "./routes/RegisterPage";
import DashboardPage from "./routes/DashboardPage";
import MessageFormPage from "./routes/MessageFormPage";
import ContactFormPage from "./routes/ContactFormPage";

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <ToastProvider>
          <Routes>
            <Route path="/login" element={<LoginPage />} />
            <Route path="/register" element={<RegisterPage />} />
            <Route element={<ProtectedRoute />}>
              <Route path="/dashboard" element={<DashboardPage />} />
              <Route path="/messages/new" element={<MessageFormPage />} />
              <Route path="/messages/:id" element={<MessageFormPage />} />
              <Route path="/contacts/new" element={<ContactFormPage />} />
              <Route path="/contacts/:id" element={<ContactFormPage />} />
            </Route>
            <Route path="*" element={<Navigate to="/dashboard" replace />} />
          </Routes>
        </ToastProvider>
      </AuthProvider>
    </BrowserRouter>
  );
}
