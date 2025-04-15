import * as React from 'react';
import { cn } from '@/utils/utils';
import { Search } from 'lucide-react';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import beststar from '../assets/beststar.jpg';
import opengms from '../assets/opengms.png';
import gridman from '../assets/gridman.png';
import { useContext } from 'react';
import { SidebarContext, LanguageContext } from '../App';

export interface NavbarProps extends React.HTMLAttributes<HTMLElement> {
  children?: React.ReactNode;
  onNavItemClick?: (item: string) => void;
}

export function Navbar({ children, className, onNavItemClick, ...props }: NavbarProps) {
  // 使用全局语言上下文
  const { language, setLanguage } = useContext(LanguageContext);
  // 获取当前激活的侧边栏类型
  const { activeSidebar } = useContext(SidebarContext);

  const toggleLanguage = () => {
    setLanguage(language === 'zh' ? 'en' : 'zh');
  };

  const navItems = [
    { href: '/', labelZh: '首页', labelEn: 'Home' },
    { href: '/schemas', labelZh: '模板', labelEn: 'Schema', type: 'schema' },
    { href: '/new', labelZh: '新建', labelEn: 'New', type: 'operate' },
    { href: '/help', labelZh: '帮助', labelEn: 'Help' },
    { href: '/about', labelZh: '关于', labelEn: 'About' },
  ];

  const handleNavItemClick = (e: React.MouseEvent<HTMLAnchorElement>, item: string) => {
    if (onNavItemClick) {
      e.preventDefault();
      onNavItemClick(item);
    }
  };

  // 判断导航项是否处于激活状态
  const isActive = (type?: string) => {
    if (!type) return false;
    return type === activeSidebar;
  };

  return (
    <nav
      className={cn(
        'flex items-center justify-between p-4 border-b bg-black text-white h-20 z-50 relative',
        className
      )}
      {...props}
    >
      <div className="flex items-center gap-4 w-1/5">
        <div className="flex items-center ml-5 ">
          <img src={gridman} className="h-20 w-20" alt="Gridman"/>
          <a href="/" className="font-bold text-5xl text-white">
            Gridman
          </a>
        </div>
        <div className="flex items-center ml-7 mr-2">
          <a href="http://geomodeling.njnu.edu.cn/" target="_blank" rel="noopener noreferrer">
            <img src={opengms} className="h-10 w-32" alt="OpenGMS" />
          </a>
        </div>
      </div>
      <div className="flex items-center gap-6 mx-6 flex-grow">
        {navItems.map((item, index) => (
          <a
            key={index}
            href={item.href}
            className={cn(
              "transition-colors text-3xl font-bold",
              isActive(item.type) ? "text-[#71F6FF]" : "text-gray-300 hover:text-white"
            )}
            onClick={(e) => handleNavItemClick(e, language === 'zh' ? item.labelZh : item.labelEn)}
          >
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
          <Label htmlFor="language-switch" className="text-sm text-gray-300">
            EN
          </Label>
          <Switch
            id="language-switch"
            checked={language === 'zh'}
            onCheckedChange={() => toggleLanguage()}
            className="bg-gray-700 data-[state=checked]:bg-blue-500"
          />
          <Label htmlFor="language-switch" className="text-sm text-gray-300">
            中
          </Label>
        </div>
      </div>
      <div className="flex items-center gap-2 ml-2">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Avatar className="cursor-pointer">
              <AvatarImage src={beststar} />
              <AvatarFallback>U</AvatarFallback>
            </Avatar>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>
              {language === 'zh' ? '我的账户' : 'My Account'}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {language === 'zh' ? '个人资料' : 'Profile'}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {language === 'zh' ? '设置' : 'Settings'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem>
              {language === 'zh' ? '登录' : 'Login'}
            </DropdownMenuItem>
            <DropdownMenuItem>
              {language === 'zh' ? '注册' : 'Register'}
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </nav>
  );
}
