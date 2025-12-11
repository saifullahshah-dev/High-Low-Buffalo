import React from 'react';
import Header from './Header';
import { MadeWithDyad } from './made-with-dyad';

interface LayoutProps {
  children: React.ReactNode;
}

const Layout: React.FC<LayoutProps> = ({ children }) => {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 p-4 md:p-6">
        {children}
      </main>
      <MadeWithDyad />
    </div>
  );
};

export default Layout;