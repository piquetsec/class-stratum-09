
import React from 'react';

const Footer = () => {
  const year = new Date().getFullYear();
  
  return (
    <footer className="w-full py-4 px-6 border-t border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md mt-auto">
      <div className="container mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
        <p className="text-sm text-gray-600 dark:text-gray-400">
          © {year} EduSys. Todos os direitos reservados.
        </p>
        <div className="flex space-x-4">
          <a 
            href="#" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Termos de Uso
          </a>
          <a 
            href="#" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Política de Privacidade
          </a>
          <a 
            href="#" 
            className="text-sm text-gray-600 dark:text-gray-400 hover:text-primary dark:hover:text-primary transition-colors"
          >
            Suporte
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
