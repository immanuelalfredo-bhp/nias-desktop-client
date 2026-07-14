import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Bootstrap from './pages/Bootstrap';
import UsersPage from './pages/Users';
import AttributesPage from './pages/Attributes';
import LoggedInLayout from './components/layout/LoggedInLayout';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<LoggedInLayout />}>
          <Route path="/dashboard" element={<Dashboard />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/attributes" element={<AttributesPage />} />
        </Route>
        <Route path="/bootstrap" element={<Bootstrap />} />
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}
export default App;
