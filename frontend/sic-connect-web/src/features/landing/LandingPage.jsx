import { Link } from 'react-router-dom';
import { User, Users, Briefcase, Calendar, FolderGit2, Bell, ArrowRight } from 'lucide-react';
import { useAuth } from '../../context/AuthContext.jsx';

/** Brand mark, matching the split auth layout. */
function Logo({ className = 'text-brand-700' }) {
  return (
    <span
      className={`inline-flex items-center gap-2 text-lg font-bold tracking-tight ${className}`}
    >
      <svg
        className="icon"
        focusable="false"
        aria-hidden="true"
        width="130"
        height="29"
        viewBox="0 0 130 29"
      >
       <svg class="icon" focusable="false" aria-hidden="true" width="130" height="29" viewBox="0 0 130 29" data-di-res-id="a27f4635-94bb251f" data-di-rand="1784818166494">
              <g transform="translate(-250 -7)">
                <path d="M0,13.835V12.482H4.609V14.2a1.558,1.558,0,0,0,1.724,1.6A1.509,1.509,0,0,0,8,14.6a2.237,2.237,0,0,0-.03-1.322C7.076,10.976.981,9.931.208,6.333a6.531,6.531,0,0,1-.029-2.4C.654,1.045,3.122,0,6.184,0c2.438,0,5.8.585,5.8,4.458V5.719H7.7V4.612a1.492,1.492,0,0,0-1.605-1.6,1.452,1.452,0,0,0-1.575,1.2,2.468,2.468,0,0,0,.03.922c.5,2.059,7.017,3.167,7.73,6.887a8.481,8.481,0,0,1,.029,2.921C11.892,17.893,9.336,19,6.244,19,3,19,0,17.8,0,13.835Zm55.837-.062V12.421h4.549v1.691a1.533,1.533,0,0,0,1.695,1.6,1.49,1.49,0,0,0,1.665-1.168,2.147,2.147,0,0,0-.029-1.292c-.863-2.274-6.9-3.319-7.671-6.917a6.37,6.37,0,0,1-.03-2.367c.476-2.859,2.944-3.9,5.946-3.9,2.409,0,5.739.615,5.739,4.427v1.23H63.449V4.643a1.485,1.485,0,0,0-1.575-1.6,1.4,1.4,0,0,0-1.546,1.168,2.463,2.463,0,0,0,.029.922C60.832,7.194,67.284,8.27,68,11.959a8.314,8.314,0,0,1,.029,2.89c-.416,2.952-2.943,4.028-6.005,4.028C58.811,18.877,55.837,17.678,55.837,13.773Zm16.293.647A7.18,7.18,0,0,1,72.1,13.25V.523h4.341V13.65a5.023,5.023,0,0,0,.029.677,1.682,1.682,0,0,0,3.271,0,4.852,4.852,0,0,0,.03-.677V.523h4.341V13.25c0,.339-.03.984-.03,1.169-.3,3.319-2.825,4.4-5.976,4.4S72.428,17.739,72.13,14.419Zm35.739-.185a9.539,9.539,0,0,1-.059-1.168V5.6c0-.308.029-.861.059-1.169.386-3.319,2.973-4.365,6.036-4.365,3.033,0,5.708,1.045,6.006,4.365A8.781,8.781,0,0,1,119.94,5.6v.584H115.6V5.2a3.791,3.791,0,0,0-.059-.677,1.777,1.777,0,0,0-3.42,0,3.772,3.772,0,0,0-.059.829v8.117a5.1,5.1,0,0,0,.03.677,1.707,1.707,0,0,0,1.813,1.291,1.633,1.633,0,0,0,1.754-1.291,2.554,2.554,0,0,0,.03-.677V10.883h-1.754V8.3H120v4.765a9.377,9.377,0,0,1-.06,1.168c-.3,3.228-3,4.366-6.036,4.366S108.166,17.462,107.869,14.235Zm-60.5,4.027L47.245,1.845,44.272,18.262H39.931L36.987,1.845l-.118,16.417H32.587L32.943.554h6.988L42.1,14.388,44.272.554h6.987l.386,17.708Zm-22.835,0L22.211,1.845,19.831,18.262H15.194L18.344.554h7.642l3.152,17.708Zm72.665-.184L92.884,3.352l.238,14.726H88.9V.554h6.363l4.044,14.265L99.068.554h4.251V18.078Z" transform="translate(255 12)"></path>
              </g>
            </svg>
      </svg>

      <span>Connect</span>
    </span>
  );
}
 const features = [
  { icon: User, title: 'Alumni Profiles', text: 'Skills, certifications, portfolio and employment in one profile.' },
  { icon: Users, title: 'Community Directory', text: 'Search and connect with graduates by skill, cohort and industry.' },
  { icon: Briefcase, title: 'Opportunities Hub', text: 'Jobs, internships, graduate programmes, scholarships and funding.' },
  { icon: Calendar, title: 'Events', text: 'Discover and register for alumni meetups, talks and workshops.' },
  { icon: FolderGit2, title: 'Project Showcase', text: 'Publish your best work with tech stack, demos and awards.' },
  { icon: Bell, title: 'Announcements', text: 'Stay current with platform news and community updates.' },
];

const stats = [
  { value: '1,200+', label: 'Alumni' },
  { value: '340+', label: 'Opportunities' },
  { value: '90+', label: 'Events' },
  { value: '500+', label: 'Projects' },
];

export function LandingPage() {
  const { isAuthenticated } = useAuth();
  const primaryTo = isAuthenticated ? '/dashboard' : '/register';

  return (
    <div className="min-h-screen bg-white">
      {/* Nav */}
      <header className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Logo />
        <nav className="hidden items-center gap-6 text-sm font-medium text-slate-700 md:flex">
          <a href="#features" className="hover:text-brand-600">Features</a>
          <a href="#about" className="hover:text-brand-600">About</a>
          <Link to="/contact" className="hover:text-brand-600">Contact</Link>
        </nav>
        <div className="flex items-center gap-2">
          {isAuthenticated ? (
            <Link to="/dashboard" className="btn-primary">Go to dashboard</Link>
          ) : (
            <>
              <Link to="/login" className="btn-secondary">Log in</Link>
              <Link to="/register" className="btn-primary">Sign up</Link>
            </>
          )}
        </div>
      </header>

      {/* Hero */}
      <section className="relative overflow-hidden bg-brand-600 text-white">
        <div
          className="absolute inset-0 opacity-20"
          style={{
            backgroundImage:
              'radial-gradient(circle at 15% 25%, #ffffff44 0, transparent 40%), radial-gradient(circle at 85% 30%, #ffffff22 0, transparent 35%)',
          }}
          aria-hidden="true"
        />
        <div className="relative mx-auto max-w-6xl px-6 py-20 lg:py-28">
          <p className="mb-4 text-sm font-semibold uppercase tracking-widest text-white/70">
            Samsung Innovation Campus · Alumni Ecosystem
          </p>
          <h1 className="max-w-3xl text-4xl font-bold leading-tight sm:text-5xl lg:text-6xl">
            The digital home for Samsung Innovation Campus alumni.
          </h1>
          <p className="mt-6 max-w-xl text-lg text-white/80">
            Network with fellow graduates, discover career opportunities, attend events, and
            showcase the work you&apos;re proud of — all in one premium community platform.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link to={primaryTo} className="btn bg-white text-brand-700 hover:bg-brand-50">
              Join the community <ArrowRight size={18} />
            </Link>
            <a href="#features" className="btn border border-white/60 text-white hover:bg-white/10">
              Explore features
            </a>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 py-20">
        <div className="mb-12 text-center">
          <h2 className="text-3xl font-bold text-slate-900">Everything an alumnus needs</h2>
          <p className="mt-2 text-slate-500">One platform for connection, opportunity and growth.</p>
        </div>
        <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, text }) => (
            <div
              key={title}
              className="card p-6 transition-transform duration-200 hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="grid h-11 w-11 place-items-center rounded-md bg-brand-50 text-brand-600">
                <Icon size={20} />
              </span>
              <h3 className="mt-4 text-lg font-semibold text-slate-900">{title}</h3>
              <p className="mt-1 text-sm text-slate-500">{text}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Stats */}
      <section id="about" className="bg-slate-50">
        <div className="mx-auto grid max-w-6xl grid-cols-2 gap-8 px-6 py-14 lg:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="text-center">
              <p className="text-4xl font-bold text-brand-600">{s.value}</p>
              <p className="mt-1 text-sm font-medium text-slate-500">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white">
        <div className="mx-auto flex max-w-6xl flex-col items-center justify-between gap-4 px-6 py-8 sm:flex-row">
          <Logo />
          <p className="text-sm text-slate-500">
            © {new Date().getFullYear()} Samsung Innovation Campus · Alumni Ecosystem
          </p>
          <Link to="/contact" className="text-sm font-medium text-brand-600 hover:text-brand-700">
            Contact us
          </Link>
        </div>
      </footer>
    </div>
  );
}
