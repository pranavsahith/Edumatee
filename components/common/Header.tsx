import React from 'react';

interface HeaderProps {
  icon: React.ReactNode;
  title: string;
}

const Header: React.FC<HeaderProps> = ({ icon, title }) => {
  return (
    <header className="flex-shrink-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
      <div className="flex items-center">
        <div className="p-2 rounded-full bg-primary-100 dark:bg-primary-900 text-primary-600 dark:text-primary-300">
            {icon}
        </div>
        <h1 className="text-xl font-semibold ml-4 text-gray-800 dark:text-gray-100">{title}</h1>
      </div>
    </header>
  );
};

export default Header;
