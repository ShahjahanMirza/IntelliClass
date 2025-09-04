import React, { useState } from 'react';
import { NavLink } from 'react-router-dom';
import { BookOpenIcon, HomeIcon, CalendarIcon, UsersIcon, UserIcon, PlusIcon, MessageSquareIcon, MenuIcon, XIcon } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle }) => {
  const {
    user,
    canCreateClasses,
    canJoinClasses
  } = useAuth();

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed lg:static inset-y-0 left-0 z-50 lg:z-auto
        w-64 bg-white border-r border-gray-200 flex flex-col h-full
        transform transition-transform duration-300 ease-in-out lg:transform-none
        ${isOpen ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'}
      `}>
      <div className="p-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center">
            <img src="/IntelliClass.jpg" alt="IntelliClass Logo" className="h-8 w-8" />
            <div className="ml-3">
              <h1 className="text-lg font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
                IntelliClass
              </h1>
              <p className="text-xs text-gray-500">Smart Learning Platform</p>
            </div>
          </div>
          {/* Mobile close button */}
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-md hover:bg-gray-100"
          >
            <XIcon className="h-5 w-5" />
          </button>
        </div>
      </div>
      <nav className="flex-1 p-4 space-y-1">
        <NavLink to="/dashboard" className={({
        isActive
      }) => `flex items-center p-3 text-gray-700 rounded-md ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>
          <HomeIcon className="h-5 w-5 mr-3" />
          Dashboard
        </NavLink>
        <NavLink to="/dashboard/classes" className={({
        isActive
      }) => `flex items-center p-3 text-gray-700 rounded-md ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>
          <BookOpenIcon className="h-5 w-5 mr-3" />
          Classes
        </NavLink>
        <NavLink to="/dashboard/calendar" className={({
        isActive
      }) => `flex items-center p-3 text-gray-700 rounded-md ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>
          <CalendarIcon className="h-5 w-5 mr-3" />
          Calendar
        </NavLink>
        <NavLink to="/dashboard/tickets" className={({
        isActive
      }) => `flex items-center p-3 text-gray-700 rounded-md ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>
          <MessageSquareIcon className="h-5 w-5 mr-3" />
          Grade Disputes
        </NavLink>
        <NavLink to="/dashboard/people" className={({
        isActive
      }) => `flex items-center p-3 text-gray-700 rounded-md ${isActive ? 'bg-blue-50 text-blue-700' : 'hover:bg-gray-100'}`}>
          <UsersIcon className="h-5 w-5 mr-3" />
          People
        </NavLink>
      </nav>
      <div className="p-4 border-t border-gray-200">
        <div className="text-sm font-medium text-gray-500 mb-2">
          QUICK ACTIONS
        </div>
        {canCreateClasses() && (
          <NavLink to="/dashboard/classes/create" className="flex items-center p-3 rounded-md bg-blue-600 text-white hover:bg-blue-700">
            <PlusIcon className="h-5 w-5 mr-2" />
            Create Class
          </NavLink>
        )}
        {canJoinClasses() && (
          <NavLink to="/dashboard/classes/join" className="flex items-center p-3 mt-2 text-gray-700 rounded-md border border-gray-300 hover:bg-gray-100">
            <UserIcon className="h-5 w-5 mr-2" />
            Join Class
          </NavLink>
        )}
      </div>
      <NavLink to="/dashboard/profile" className="p-4 border-t border-gray-200 flex items-center hover:bg-gray-50">
        {user?.avatar_url ? (
          <img
            src={user.avatar_url}
            alt={user.name || 'User'}
            className="h-8 w-8 rounded-full object-cover"
          />
        ) : (
          <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
            <span className="text-blue-600 font-medium text-sm">
              {user?.name?.charAt(0)?.toUpperCase() || 'U'}
            </span>
          </div>
        )}
        <div className="ml-3">
          <p className="text-sm font-medium">{user?.name || 'Loading...'}</p>
          <p className="text-xs text-gray-500 capitalize">{user?.role || ''}</p>
        </div>
      </NavLink>
      </div>
    </>
  );
};
export default Sidebar;
