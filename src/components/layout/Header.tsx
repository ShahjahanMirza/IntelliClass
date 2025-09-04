import React from 'react';
import { LogOutIcon, MenuIcon } from 'lucide-react';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import NotificationDropdown from '../NotificationDropdown';
interface HeaderProps {
  onMenuClick: () => void;
}

const Header: React.FC<HeaderProps> = ({ onMenuClick }) => {
  const location = useLocation();
  const navigate = useNavigate();
  const { logout } = useAuth();

  const handleSignOut = () => {
    logout();
    navigate('/login');
  };
  const getPageTitle = () => {
    const path = location.pathname;
    if (path === '/dashboard') return 'Dashboard';
    if (path === '/dashboard/classes') return 'Classes';
    if (path.startsWith('/dashboard/classes/') && path.includes('/assignments/')) return 'Assignment';
    if (path.startsWith('/dashboard/classes/') && path.includes('/create-assignment')) return 'Create Assignment';
    if (path.startsWith('/dashboard/classes/')) return 'Class Details';
    if (path === '/dashboard/calendar') return 'Calendar';
    if (path === '/dashboard/people') return 'People';
    if (path === '/dashboard/tickets') return 'Grade Disputes';
    if (path === '/dashboard/profile') return 'Profile';
    return 'Classroom';
  };
  return <header className="bg-white border-b border-gray-200 p-[18px] flex items-center justify-between">
      <div className="flex items-center">
        {/* Mobile menu button */}
        <button
          onClick={onMenuClick}
          className="lg:hidden p-2 rounded-md hover:bg-gray-100 mr-3"
        >
          <MenuIcon className="h-5 w-5" />
        </button>
        <h1 className="text-xl font-semibold">{getPageTitle()}</h1>
      </div>
      <div className="flex items-center space-x-4">
        <NotificationDropdown />
        <button
          onClick={handleSignOut}
          className="flex items-center px-3 py-2 text-sm text-gray-700 hover:bg-gray-100 rounded-md"
        >
          <LogOutIcon className="h-4 w-4 mr-2" />
          Sign Out
        </button>
      </div>
    </header>;
};
export default Header;
