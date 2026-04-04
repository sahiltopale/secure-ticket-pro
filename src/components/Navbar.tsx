import { useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { Menu, X, Wallet, LogOut, Shield } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ThemeToggle from '@/components/ThemeToggle';
import { useAuth } from '@/contexts/AuthContext';
import { useWallet } from '@/contexts/WalletContext';

const navLinks = [
  { to: '/', label: 'Events' },
  { to: '/my-tickets', label: 'My Tickets', auth: true },
  { to: '/contact', label: 'Contact' },
  { to: '/help', label: 'Help' },
  { to: '/about', label: 'About Us' },
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const { user, isAdmin, signOut } = useAuth();
  const { walletAddress, isConnecting, connectWallet } = useWallet();
  const location = useLocation();

  const shortAddress = walletAddress
    ? `${walletAddress.slice(0, 6)}...${walletAddress.slice(-4)}`
    : null;

  return (
    <nav className="sticky top-0 z-50 glass-card border-b">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to="/" className="flex items-center gap-2 font-display text-xl font-bold text-primary">
            <Shield className="h-6 w-6" />
            Authentix
          </Link>

          {/* Desktop nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map(link => {
              if (link.auth && !user) return null;
              return (
                <Link
                  key={link.to}
                  to={link.to}
                  className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${
                    location.pathname === link.to ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
            {isAdmin && (
              <Link
                to="/admin"
                className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${
                  location.pathname === '/admin' ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                }`}
              >
                Admin
              </Link>
            )}
          </div>

          <div className="hidden md:flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={connectWallet}
              disabled={isConnecting}
              className="gap-2"
            >
              <Wallet className="h-4 w-4" />
              {shortAddress || (isConnecting ? 'Connecting...' : 'Connect Wallet')}
            </Button>
            {user ? (
              <Button variant="ghost" size="sm" onClick={signOut} className="gap-2">
                <LogOut className="h-4 w-4" /> Sign Out
              </Button>
            ) : (
              <Link to="/auth">
                <Button size="sm">Login / Register</Button>
              </Link>
            )}
          </div>

          {/* Mobile toggle */}
          <button className="md:hidden p-2" onClick={() => setMobileOpen(!mobileOpen)}>
            {mobileOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>

        {/* Mobile nav */}
        {mobileOpen && (
          <div className="md:hidden pb-4 animate-fade-in">
            <div className="flex flex-col gap-1">
              {navLinks.map(link => {
                if (link.auth && !user) return null;
                return (
                  <Link
                    key={link.to}
                    to={link.to}
                    onClick={() => setMobileOpen(false)}
                    className={`px-3 py-2 rounded-md text-sm font-medium transition-colors hover:bg-muted ${
                      location.pathname === link.to ? 'text-primary bg-primary/10' : 'text-muted-foreground'
                    }`}
                  >
                    {link.label}
                  </Link>
                );
              })}
              {isAdmin && (
                <Link to="/admin" onClick={() => setMobileOpen(false)} className="px-3 py-2 rounded-md text-sm font-medium text-muted-foreground hover:bg-muted">
                  Admin
                </Link>
              )}
              <div className="flex flex-col gap-2 pt-2 border-t mt-2">
                <Button variant="outline" size="sm" onClick={connectWallet} disabled={isConnecting} className="gap-2 justify-start">
                  <Wallet className="h-4 w-4" />
                  {shortAddress || 'Connect Wallet'}
                </Button>
                {user ? (
                  <Button variant="ghost" size="sm" onClick={() => { signOut(); setMobileOpen(false); }} className="gap-2 justify-start">
                    <LogOut className="h-4 w-4" /> Sign Out
                  </Button>
                ) : (
                  <Link to="/auth" onClick={() => setMobileOpen(false)}>
                    <Button size="sm" className="w-full">Login / Register</Button>
                  </Link>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
