import React from 'react';
import { Link } from 'react-router-dom';
import { Home, History, Settings, Mountain } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { useIsMobile } from '@/hooks/use-mobile';

const Header = () => {
  const isMobile = useIsMobile();

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
      <Link to="/settings" className="flex items-center gap-2 text-lg font-medium transition-colors hover:text-primary md:text-sm">
        <Settings className="h-5 w-5" />
        Settings
      </Link>
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