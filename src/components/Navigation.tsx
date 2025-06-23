import React from "react";
import {
  Home,
  Search,
  Music,
  Heart,
  Settings,
  Plus,
  User
} from "lucide-react";

interface DockItem {
  icon: React.ElementType;
  label: string;
  id: string;
}

interface NavigationProps {
  activeTab: string;
  onTabChange: (tab: string) => void;
}

const Navigation: React.FC<NavigationProps> = ({ activeTab, onTabChange }) => {
  const items: DockItem[] = [
    { id: "home", icon: Home, label: "Home" },
    { id: "search", icon: Search, label: "Search" },
    { id: "music", icon: Music, label: "Music" },
    { id: "favorites", icon: Heart, label: "Favorites" },
    { id: "add", icon: Plus, label: "Add New" },
    { id: "profile", icon: User, label: "Profile" },
    { id: "settings", icon: Settings, label: "Settings" }
  ];

  return (
    <div className="fixed bottom-4 left-4 right-4 z-50 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-2xl shadow-xl px-4 py-2 flex justify-between items-center">
      {items.map((item) => {
        const Icon = item.icon;
        const isActive = activeTab === item.id;
        return (
          <button
            key={item.id}
            onClick={() => onTabChange(item.id)}
            className={`p-2 rounded-full transition-colors ${
              isActive ? "text-blue-600" : "text-gray-500 dark:text-gray-400"
            }`}
            aria-label={item.label}
          >
            <Icon className="w-6 h-6" />
          </button>
        );
      })}
    </div>
  );
};

export default Navigation;
