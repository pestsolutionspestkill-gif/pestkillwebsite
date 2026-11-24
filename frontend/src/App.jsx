import { lazy, Suspense } from 'react';
import { Routes, Route, useLocation, Link, Navigate } from 'react-router-dom';
import RouteSeo from './seo/RouteSeo';
import { REDIRECTS } from './seo/meta';
import Navbar from './components/Navbar';
import SmoothScroll from './components/SmoothScroll';
import { FounderStrip } from './components/Founder';
const AntiTermitePiping = lazy(() => import('./pages/AntiTermitePiping'));
const BookOnline = lazy(() => import('./pages/BookOnline'));
const PestLibrary = lazy(() => import('./pages/PestLibrary'));
const PestDetail = lazy(() => import('./pages/PestDetail'));
const Business = lazy(() => import('./pages/Business'));
const SectorPage = lazy(() => import('./pages/SectorPage'));
const IPM = lazy(() => import('./pages/IPM'));
const Locations = lazy(() => import('./pages/Locations'));
const Careers = lazy(() => import('./pages/Careers'));
import Footer from './components/Footer';
import Home from './pages/Home';
const Services = lazy(() => import('./pages/Services'));
const ServiceDetail = lazy(() => import('./pages/ServiceDetail'));
const About = lazy(() => import('./pages/About'));
const Contact = lazy(() => import('./pages/Contact'));
const Login = lazy(() => import('./pages/Login'));
const Register = lazy(() => import('./pages/Register'));
const Blog = lazy(() => import('./pages/Blog'));
const BlogDetail = lazy(() => import('./pages/BlogDetail'));
const TermiteControl = lazy(() => import('./pages/TermiteControl'));
const CockroachControl = lazy(() => import('./pages/CockroachControl'));
const BedBugTreatment = lazy(() => import('./pages/BedBugTreatment'));
const RodentControl = lazy(() => import('./pages/RodentControl'));
const CityPage = lazy(() => import('./pages/CityPage'));
const Shop = lazy(() => import('./pages/Shop'));
const ProductDetail = lazy(() => import('./pages/ProductDetail'));
const Cart = lazy(() => import('./pages/Cart'));
const PcoAccount = lazy(() => import('./pages/PcoAccount'));
const PestIdentifier = lazy(() => import('./pages/PestIdentifier'));
const Verify = lazy(() => import('./pages/Verify'));
// Staff console, customer account and print pages load on demand, keeping the public site light.
const Dashboard = lazy(() => import('./pages/Dashboard'));
const Admin = lazy(() => import('./pages/Admin'));
const PrintInvoice = lazy(() => import('./pages/print/PrintDocs').then((m) => ({ default: m.PrintInvoice })));
const PrintCertificate = lazy(() => import('./pages/print/PrintDocs').then((m) => ({ default: m.PrintCertificate })));

const PageLoading = () => <div style={{ minHeight: '60vh', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--muted)' }}>Loading…</div>;

const NotFound = () => (
  <section style={{ minHeight: '60vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: '80px 20px', textAlign: 'center' }}>
    <h1 style={{ fontSize: 'clamp(2.4rem, 6vw, 4rem)', letterSpacing: '-0.04em' }}>Page not found.</h1>
    <p style={{ color: 'var(--muted)', maxWidth: 420 }}>The page you are looking for has moved or does not exist.</p>
    <Link to="/" className="btn btn-primary">Back to home</Link>
  </section>
);

function App() {
  const { pathname } = useLocation();
  const consoleMode = pathname.startsWith('/admin') || pathname.startsWith('/print');
  const hasFounderSection = pathname === '/' || pathname === '/about';
  return (
    <div className="app">
      <SmoothScroll />
      <RouteSeo />
      {!consoleMode && <Navbar />}
      <main style={{ minHeight: '100vh', paddingTop: consoleMode ? 0 : 'var(--nav-h)' }}>
        <Suspense fallback={<PageLoading />}>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/services" element={<Services />} />
          <Route path="/services/anti-termite-piping" element={<AntiTermitePiping />} />
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
          <Route path="/pest-control/:city" element={<CityPage />} />
          {Object.entries(REDIRECTS).map(([from, to]) => <Route key={from} path={from} element={<Navigate to={to} replace />} />)}
          <Route path="/shop" element={<Shop />} />
          <Route path="/shop/:slug" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/pco-account" element={<PcoAccount />} />
          <Route path="/pest-identifier" element={<PestIdentifier />} />
          <Route path="/verify" element={<Verify />} />
          <Route path="/verify/:ref" element={<Verify />} />
          <Route path="/print/invoice/:id" element={<PrintInvoice />} />
          <Route path="/print/certificate/:ref" element={<PrintCertificate />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
        </Suspense>
      </main>
      {!consoleMode && !hasFounderSection && <FounderStrip />}
      {!consoleMode && <Footer />}
    </div>
  );
}

export default App;