import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Login from './pages/login/Login';
import Pregen from './pages/pregen/PregenRuleset';
import Catalogue from './pages/catalogue/Catalogue';
import Brands from './pages/definitions/brands/Brands';
import Vendors from './pages/definitions/vendors/Vendors';
import Dimensions from './pages/definitions/dimensions/Dimensions';
import Categories from './pages/definitions/categories/Categories';
import Systems from './pages/definitions/systems/Systems';
import Modes from './pages/definitions/modes/Modes';
import Tags from './pages/definitions/tags/Tags';
import Uoms from './pages/definitions/uoms/Uoms';
import UsersPage from './pages/Users';
import Audit from './pages/system/audit/Audit';
import MainLayout from './components/layout/MainLayout';

function App() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route element={<MainLayout />}>
          <Route path="/catalogue" element={<Catalogue />} />
          <Route path="/pregen" element={<Pregen />} />
          <Route path="/brands" element={<Brands />} />
          <Route path="/vendors" element={<Vendors />} />
          <Route path="/dimensions" element={<Dimensions />} />
          <Route path="/categories" element={<Categories />} />
          <Route path="/systems" element={<Systems />} />
          <Route path="/modes" element={<Modes />} />
          <Route path="/tags" element={<Tags />} />
          <Route path="/uoms" element={<Uoms />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/audit" element={<Audit />} />
        </Route>
        {/* Default route */}
        <Route path="/" element={<Navigate to="/login" />} />
      </Routes>
    </HashRouter>
  );
}
export default App;
