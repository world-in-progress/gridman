import * as React from 'react';
import { cn } from '@/utils/utils';
import {
  Search,
  Home,
  Clipboard,
  FilePlus2,
  CircleHelp,
  UsersRound,
} from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import opengms from '../assets/opengms.png';
import grid from '../assets/grid.png';
import { useContext } from 'react';
import { SidebarContext, LanguageContext } from '../App';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  onNavItemClick?: (item: string) => void;
}

export function Navbar({
  children,
  className,
  onNavItemClick,
  ...props
}: NavbarProps) {
  const { language, setLanguage } = useContext(LanguageContext);
  const { activeSidebar } = useContext(SidebarContext);

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const navItems = [
    { href: '/', labelZh: '首页', labelEn: 'Home', icon: Home },
    { href: '/schemas', labelZh: '模板', labelEn: 'Schema', type: 'schema', icon: Clipboard },
    { href: '/new', labelZh: '新建', labelEn: 'New', type: 'operate', icon: FilePlus2 },
    { href: '/help', labelZh: '帮助', labelEn: 'Help', icon: CircleHelp },
    { href: '/about', labelZh: '关于', labelEn: 'About', icon: UsersRound },
  ];

  const handleNavItemClick = (
    e: React.MouseEvent<HTMLAnchorElement>,
    item: string
  ) => {
    if (onNavItemClick) {
      e.preventDefault();
      onNavItemClick(item);
    }
  };

  const isActive = (type?: string) => {
    if (!type) return false;
    return type === activeSidebar;
  };

  return (
    <nav
      className={cn(
        'flex items-center justify-between p-4 border-b-2 bg-black text-white h-20 z-50 relative',
        className
      )}
      {...props}
    >
      <div className="flex items-center justify-center gap-4 w-1/5">
        <div className="flex items-center">
          <img src={grid} className="h-12 w-12 mr-4" alt="Gridman" />
          <a href="/" className="font-bold text-5xl text-white">
            Gridman
          </a>
        </div>
      </div>
      <div className="flex items-center gap-10 mx-6 flex-grow -ml-1">
        {navItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={cn(
              'transition-colors text-3xl font-bold flex items-center gap-2',
              isActive(item.type)
                ? 'text-[#71F6FF]'
                : 'text-gray-300 hover:text-white'
            )}
            onClick={(e) =>
              handleNavItemClick(
                e,
                language === 'zh' ? item.labelZh : item.labelEn
              )
            }
          >
            {React.createElement(item.icon, { 
              className: 'w-10 h-10',
              strokeWidth: 2
            })}
            {language === 'zh' ? item.labelZh : item.labelEn}
          </a>
        ))}
      </div>
      <div className="relative w-64 mx-4 mr-20">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder={language === 'zh' ? '搜索...' : 'Search...'}
            className="w-full rounded-md border border-gray-700 bg-gray-800 px-10 py-2 text-sm text-white placeholder:text-gray-400"
          />
        </div>
      </div>
      <div className="flex items-center mr-20 ">
        <div className="flex items-center space-x-2">
          <Label
            htmlFor="language-switch"
            className="text-md font-bold text-gray-300"
          >
            EN
          </Label>
          <Switch
            id="language-switch"
            checked={language === 'zh'}
            onCheckedChange={() => toggleLanguage()}
            className="bg-gray-700 data-[state=checked]:bg-blue-500"
          />
          <Label
            htmlFor="language-switch"
            className="text-md font-bold text-gray-300"
          >
            中文
          </Label>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2 mr-5">
        <a
          href="http://geomodeling.njnu.edu.cn/"
          target="_blank"
          rel="noopener noreferrer"
        >
          <img src={opengms} className="h-15 w-48" alt="OpenGMS" />
        </a>
      </div>
    </nav>
  );
}
