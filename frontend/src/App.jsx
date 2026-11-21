import { Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import SmoothScroll from './components/SmoothScroll';
import AntiTermitePiping from './pages/AntiTermitePiping';
import Footer from './components/Footer';
import Home from './pages/Home';
import Services from './pages/Services';
import ServiceDetail from './pages/ServiceDetail';
import About from './pages/About';
import Contact from './pages/Contact';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Blog from './pages/Blog';
import BlogDetail from './pages/BlogDetail';
import TermiteControl from './pages/TermiteControl';
import CockroachControl from './pages/CockroachControl';
import BedBugTreatment from './pages/BedBugTreatment';
import RodentControl from './pages/RodentControl';
import Jaipur from './pages/Jaipur';
import Jodhpur from './pages/Jodhpur';
import Udaipur from './pages/Udaipur';
import Kota from './pages/Kota';
import Ajmer from './pages/Ajmer';
import Bikaner from './pages/Bikaner';
import Alwar from './pages/Alwar';
import Bharatpur from './pages/Bharatpur';

function App() {
  return (
    <div className="app">
      <SmoothScroll />
      <Navbar />
      <main style={{minHeight: '100vh', paddingTop: 'var(--nav-h)'}}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/anti-termite-piping" element={<AntiTermitePiping />} />
          <Route path="/anti-termite-piping" element={<AntiTermitePiping />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/about" element={<About />} />
          <Route path="/contact" element={<Contact />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route path="/dashboard/*" element={<Dashboard />} />
          <Route path="/admin/*" element={<Admin />} />
          <Route path="/blog" element={<Blog />} />
          <Route path="/blog/:slug" element={<BlogDetail />} />
          <Route path="/termite-control" element={<TermiteControl />} />
          <Route path="/cockroach-control" element={<CockroachControl />} />
          <Route path="/bed-bug-treatment" element={<BedBugTreatment />} />
          <Route path="/rodent-control" element={<RodentControl />} />
          <Route path="/jaipur" element={<Jaipur />} />
          <Route path="/jodhpur" element={<Jodhpur />} />
          <Route path="/udaipur" element={<Udaipur />} />
          <Route path="/kota" element={<Kota />} />
          <Route path="/ajmer" element={<Ajmer />} />
          <Route path="/bikaner" element={<Bikaner />} />
          <Route path="/alwar" element={<Alwar />} />
          <Route path="/bharatpur" element={<Bharatpur />} />
        </Routes>
      </main>
      <Footer />
    </div>
  );
}

export default App;