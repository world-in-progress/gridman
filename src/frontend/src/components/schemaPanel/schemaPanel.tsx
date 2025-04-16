import * as React from 'react';
import { Blocks, FlaskConical, Minus, Plus } from 'lucide-react';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarRail,
} from '@/components/ui/sidebar';
import { SearchForm } from '../ui/search-form';
import { SubNavPanel } from './subNavPanel';

interface MenuItem {
  title: string;
  url: string;
  isActive?: boolean;
}

interface NavItem {
  title: string;
  url: string;
  icon?: React.ComponentType<{ className?: string }>;
  items?: MenuItem[];
}

const data = {
  navMain: [
    {
      title: "Test Schema",
      url: "#",
      items: [
        {
          title: "Show Details",
          url: "#",
        },
        {
          title: "Create From",
          url: "#",
        },
        {
          title: "Create Project",
          url: "#",
        },
      ],
    },
  ],
}

export default function SchemaPanel({
  ...props
}: React.ComponentProps<typeof Sidebar>) {
  return (
    <Sidebar {...props}>
      <SidebarContent>
        <h1 className="text-4xl font-semibold p-3 text-center">Schema List</h1>
        <SearchForm className="flex flex-col gap-2" />
        {/* <SidebarGroup>
          <SidebarMenu>
            {data.navMain.map((item: NavItem, index) => (
              <Collapsible
                key={item.title}
                defaultOpen={index === 1}
                className="group/collapsible"
              >
                <SidebarMenuItem>
                  <CollapsibleTrigger asChild>
                    <SidebarMenuButton>
                      {item.icon && <item.icon className="h-4 w-4" />}
                      {item.title}{' '}
                      <Plus className="ml-auto group-data-[state=open]/collapsible:hidden" />
                      <Minus className="ml-auto group-data-[state=closed]/collapsible:hidden" />
                    </SidebarMenuButton>
                  </CollapsibleTrigger>
                  {item.items?.length ? (
                    <CollapsibleContent>
                      <SidebarMenuSub>
                        {item.items?.map((subItem: MenuItem) => (
                          <SidebarMenuSubItem key={subItem.title}>
                            <SidebarMenuSubButton
                              asChild
                              isActive={subItem.isActive}
                            >
                              <a href={subItem.url}>{subItem.title}</a>
                            </SidebarMenuSubButton>
                          </SidebarMenuSubItem>
                        ))}
                      </SidebarMenuSub>
                    </CollapsibleContent>
                  ) : null}
                </SidebarMenuItem>
              </Collapsible>
            ))}
          </SidebarMenu>
        </SidebarGroup> */}
        <SubNavPanel items={data.navMain} />
        <div className="absolute bottom-6 left-0 right-0 flex justify-center">
          <button className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full px-4 py-2 flex items-center gap-2 shadow-lg">
            <span>Create New Schema</span>
            <Plus className="h-4 w-4" />
          </button>
        </div>
      </SidebarContent>
      <SidebarRail />
    </Sidebar>
  );
}
