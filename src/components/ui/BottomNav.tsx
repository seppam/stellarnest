import { NavLink, useLocation } from 'react-router-dom';
import { Home, Send, History, BarChart2, User } from 'lucide-react';

const NAV_ITEMS = [
  { to: '/dashboard', icon: Home, label: 'Home' },
  { to: '/send', icon: Send, label: 'Send' },
  { to: '/history', icon: History, label: 'History' },
  { to: '/insights', icon: BarChart2, label: 'Insights' },
  { to: '/profile', icon: User, label: 'Profile' },
];

export default function BottomNav() {
  const { pathname } = useLocation();

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 flex justify-around items-center px-4 pt-2 pb-6 bg-white shadow-[0_-2px_10px_rgba(0,0,0,0.06)] rounded-t-3xl border-t border-surface-container-low max-w-lg mx-auto">
      {NAV_ITEMS.map(({ to, icon: Icon, label }) => {
        const isActive =
          pathname === to ||
          (to === '/dashboard' && pathname === '/');
        return (
          <NavLink
            key={to}
            to={to}
            className={`flex flex-col items-center justify-center py-1 px-3 text-[10px] font-semibold transition-colors ${
              isActive
                ? 'bg-secondary-container text-on-secondary-container rounded-full'
                : 'text-on-surface-variant'
            }`}
          >
            <Icon
              size={22}
              className={isActive ? 'text-on-secondary-container' : 'text-on-surface-variant'}
            />
            <span className="mt-0.5 text-[10px] leading-none">{label}</span>
          </NavLink>
        );
      })}
    </nav>
  );
}
