import { Bell, LogOut, Globe } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { useAuth } from "@/contexts/AuthContext";
import { useLanguage } from "@/contexts/LanguageContext";
import { useLocation } from "wouter";

interface DashboardHeaderProps {
  alertCount: number;
  onNotificationClick: () => void;
}

export default function DashboardHeader({ alertCount, onNotificationClick }: DashboardHeaderProps) {
  const { username, logout } = useAuth();
  const { language, setLanguage, t } = useLanguage();
  const [, navigate] = useLocation();
  const [languageMenuOpen, setLanguageMenuOpen] = useState(false);

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  const handleLanguageChange = (lang: 'en' | 'hi') => {
    setLanguage(lang);
    setLanguageMenuOpen(false);
  };

  const initials = username
    ? username.slice(0, 2).toUpperCase()
    : 'AS';

  return (
    <header className="h-16 border-b bg-background px-6 flex items-center justify-between sticky top-0 z-40" data-testid="header-dashboard">
      <div className="flex items-center gap-3">
        <img 
          src="/maitri-logo.png" 
          alt="Maitri Logo" 
          className="h-10 w-10 object-contain"
        />
        <h1 className="text-xl font-medium" data-testid="text-app-title">{t('dashboard.title')}</h1>
      </div>

      <div className="flex items-center gap-4">
        <DropdownMenu open={languageMenuOpen} onOpenChange={setLanguageMenuOpen}>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-language">
              <Globe className="h-5 w-5" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>Language</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={() => handleLanguageChange('en')}
              data-testid="menu-language-en"
              className={language === 'en' ? 'bg-accent' : ''}
            >
              English
            </DropdownMenuItem>
            <DropdownMenuItem 
              onClick={() => handleLanguageChange('hi')}
              data-testid="menu-language-hi"
              className={language === 'hi' ? 'bg-accent' : ''}
            >
              हिन्दी
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>

        <Button
          variant="ghost"
          size="icon"
          className="relative"
          onClick={onNotificationClick}
          data-testid="button-notifications"
        >
          <Bell className="h-5 w-5" />
          {alertCount > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-1 -right-1 h-5 w-5 flex items-center justify-center p-0 text-xs"
              data-testid="badge-notification-count"
            >
              {alertCount}
            </Badge>
          )}
        </Button>

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" data-testid="button-user-menu">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-emerald-600 text-white font-medium">
                  {initials}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <div className="flex flex-col">
                <span className="font-medium">{username || 'ASHA Worker'}</span>
                <span className="text-xs font-normal text-muted-foreground">{t('dashboard.worker')}</span>
              </div>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem data-testid="menu-profile">{t('menu.profile')}</DropdownMenuItem>
            <DropdownMenuItem data-testid="menu-settings">{t('menu.settings')}</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={handleLogout}
              data-testid="menu-logout"
              className="text-red-600 focus:text-red-600"
            >
              <LogOut className="h-4 w-4 mr-2" />
              {t('menu.logout')}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
