import { Link, useLocation } from 'react-router-dom';
import { Users, BarChart3, Settings, LogOut } from 'lucide-react';
import { motion } from 'framer-motion';

interface AdminSidebarProps {
  onLogout: () => void;
}

export default function AdminSidebar({ onLogout }: AdminSidebarProps) {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    {
      label: 'Dashboard',
      path: '/admin-dashboard',
      icon: BarChart3,
    },
    {
      label: 'Profissionais',
      path: '/admin-professionals',
      icon: Users,
    },
    {
      label: 'Configurações',
      path: '/admin-settings',
      icon: Settings,
    },
  ];

  return (
    <motion.aside
      initial={{ x: -300 }}
      animate={{ x: 0 }}
      className="w-64 bg-white border-r border-secondary/20 h-screen fixed left-0 top-0 pt-20 flex flex-col"
    >
      <nav className="flex-1 px-4 py-6">
        {menuItems.map((item) => {
          const Icon = item.icon;
          const active = isActive(item.path);

          return (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-2 transition ${
                active
                  ? 'bg-primary/10 text-primary'
                  : 'text-foreground hover:bg-background'
              }`}
            >
              <Icon className="w-5 h-5" />
              <span className="font-paragraph font-medium">{item.label}</span>
            </Link>
          );
        })}
      </nav>

      <div className="px-4 py-6 border-t border-secondary/20">
        <button
          onClick={onLogout}
          className="flex items-center gap-3 px-4 py-3 rounded-lg text-destructive hover:bg-destructive/10 w-full transition"
        >
          <LogOut className="w-5 h-5" />
          <span className="font-paragraph font-medium">Sair</span>
        </button>
      </div>
    </motion.aside>
  );
}
