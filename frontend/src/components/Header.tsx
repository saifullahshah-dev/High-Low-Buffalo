import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Home, History, Settings, Mountain, Flag, LogOut } from 'lucide-react'; // Import Flag icon
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';
import { useAuth } from '../context/AuthContext';

const Header = () => {
  const isMobile = useIsMobile();
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  if (!isAuthenticated) {
    return (
      <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
        <Link to="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
          <Mountain className="h-6 w-6" />
          <span className="sr-only">High-Low-Buffalo</span>
          <span className="hidden md:inline">High-Low-Buffalo</span>
        </Link>
      </header>
    )
  }

  const navLinks = (
    <>
      <Link to="/" className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary md:text-sm">
        <Home className="h-5 w-5" />
        Home
      </Link>
      <Link to="/history" className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary md:text-sm">
        <History className="h-5 w-5" />
        History
      </Link>
      <Link to="/follow-up" className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary md:text-sm">
        <Flag className="h-5 w-5" />
        Follow-up
      </Link>
      <Link to="/settings" className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary md:text-sm">
        <Settings className="h-5 w-5" />
        Settings
      </Link>
      <Button variant="ghost" className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary md:text-sm justify-start px-0 md:px-4" onClick={handleLogout}>
        <LogOut className="h-5 w-5" />
        Logout
      </Button>
    </>
  );

  return (
    <header className="sticky top-0 z-30 flex h-14 items-center gap-4 border-b bg-background px-4 sm:static sm:h-auto sm:border-0 sm:bg-transparent sm:px-6">
      <Link to="/" className="flex items-center gap-2 text-lg font-semibold md:text-base">
        <Mountain className="h-6 w-6" />
        <span className="sr-only">High-Low-Buffalo</span>
        <span className="hidden md:inline">High-Low-Buffalo</span>
      </Link>
      {isMobile ? (
        <Sheet>
          <SheetTrigger asChild>
            <Button size="icon" variant="outline" className="sm:hidden ml-auto">
              <Home className="h-5 w-5" />
              <span className="sr-only">Toggle Menu</span>
            </Button>
          </SheetTrigger>
          <SheetContent side="left" className="sm:max-w-xs">
            <nav className="grid gap-6 text-lg font-medium pt-8">
              {navLinks}
            </nav>
          </SheetContent>
        </Sheet>
      ) : (
        <nav className="hidden flex-col gap-6 text-lg font-medium md:flex md:flex-row md:items-center md:gap-5 md:text-sm lg:gap-6 ml-auto">
          {navLinks}
        </nav>
      )}
    </header>
  );
};

export default Header;