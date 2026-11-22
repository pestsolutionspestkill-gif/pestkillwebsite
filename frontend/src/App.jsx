import { Routes, Route, useLocation } from 'react-router-dom';
import Navbar from './components/Navbar';
import SmoothScroll from './components/SmoothScroll';
import { FounderStrip } from './components/Founder';
import AntiTermitePiping from './pages/AntiTermitePiping';
import BookOnline from './pages/BookOnline';
import PestLibrary from './pages/PestLibrary';
import PestDetail from './pages/PestDetail';
import Business from './pages/Business';
import SectorPage from './pages/SectorPage';
import IPM from './pages/IPM';
import Locations from './pages/Locations';
import Careers from './pages/Careers';
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
import { PrintInvoice, PrintCertificate } from './pages/print/PrintDocs';

function App() {
  const { pathname } = useLocation();
  const consoleMode = pathname.startsWith('/admin') || pathname.startsWith('/print');
  const hasFounderSection = pathname === '/' || pathname === '/about';
  return (
    <div className="app">
      <SmoothScroll />
      {!consoleMode && <Navbar />}
      <main style={{ minHeight: '100vh', paddingTop: consoleMode ? 0 : 'var(--nav-h)' }}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/anti-termite-piping" element={<AntiTermitePiping />} />
          <Route path="/anti-termite-piping" element={<AntiTermitePiping />} />
          <Route path="/services/:slug" element={<ServiceDetail />} />
          <Route path="/book" element={<BookOnline />} />
          <Route path="/pests" element={<PestLibrary />} />
          <Route path="/pests/:slug" element={<PestDetail />} />
          <Route path="/business" element={<Business />} />
          <Route path="/business/:slug" element={<SectorPage />} />
          <Route path="/integrated-pest-management" element={<IPM />} />
          <Route path="/locations" element={<Locations />} />
          <Route path="/careers" element={<Careers />} />
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
          <Route path="/print/invoice/:id" element={<PrintInvoice />} />
          <Route path="/print/certificate/:ref" element={<PrintCertificate />} />
        </Routes>
      </main>
      {!consoleMode && !hasFounderSection && <FounderStrip />}
      {!consoleMode && <Footer />}
    </div>
  );
}

export default App;