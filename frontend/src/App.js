import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

// Components
import Header from './components/common/Header';
import Sidebar from './components/common/Sidebar';

// Pages
import Login from './components/auth/Login';
import Register from './components/auth/Register';
import Dashboard from './pages/Dashboard';
import AddWorker from './pages/AddWorker';
import WorkerDetails from './pages/WorkerDetails';
import History from './pages/History';
import ProfileUpdate from './pages/ProfileUpdate';
import About from './pages/About';
import ResetPassword from './pages/ResetPassword';

// Auth Context
import { AuthProvider, useAuth } from './services/auth';

import './styles/App.css';


const ProtectedRoute = ({ children }) => {
  const { user } = useAuth();
  return user ? children : <Navigate to="/login" />;
};

function App() {
  return (
    <AuthProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <div className="app">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/reset" element={<ResetPassword />} />
            <Route path="*" element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            } />
          </Routes>
          <ToastContainer position="top-right" autoClose={3000} />
        </div>
      </BrowserRouter>
    </AuthProvider>
  );
}

const AppLayout = () => {
  return (
    <div className="app-layout">
      <Sidebar />
      <div className="main-content">
        {/* <Header /> */}
        <main className="content">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/add-worker" element={<AddWorker />} />
            <Route path="/worker/:id" element={<WorkerDetails />} />
            <Route path="/history" element={<History />} />
            <Route path="/profile-update" element={<ProfileUpdate />} />
            <Route path="/about" element={<About />} />
          </Routes>
        </main>
      </div>
    </div>
  );
};

export default App;