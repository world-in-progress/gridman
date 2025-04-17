import { MoreHorizontal, ChevronLeft, ChevronRight, Grid, MapPin, Layers, type LucideIcon } from "lucide-react"
import { useState, useEffect, useContext } from "react"
import { LanguageContext } from "../../App"
import Actor from "../../core/message/actor"

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  SidebarGroup,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar"

interface Schema {
  name: string;
  epsg: number;
  base_point: number[];
  grid_info: number[][];
}

interface SchemaResponse {
  grid_schemas: Schema[];
  total_count: number;
}

interface SubNavPanelProps {
  items?: {
    title: string
    url: string
    icon?: LucideIcon
    isActive?: boolean
    items?: {
      title: string
      url: string
    }[]
  }[];
  currentPage: number;
  itemsPerPage: number;
  onTotalItemsChange: (total: number) => void;
}

export function SubNavPanel({
  items: propItems,
  currentPage,
  itemsPerPage,
  onTotalItemsChange
}: SubNavPanelProps) {
  const { isMobile } = useSidebar()
  const { language } = useContext(LanguageContext)
  const [schemas, setSchemas] = useState<Schema[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const fetchSchemas = async (page: number) => {
    let worker: Worker | null = null;
    let actor: Actor | null = null;
    
    try {
      setLoading(true);
      
      const startIndex = (page - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      
      worker = new Worker(new URL('../../core/worker/base.worker.ts', import.meta.url), { type: 'module' });
      actor = new Actor(worker, {});
      
      actor.send('fetchSchemas', { startIndex, endIndex }, ((err, result) => {
        if (err) {
          console.error('获取Schema列表失败:', err);
          setError(language === 'zh' ? '获取模板列表失败' : 'Failed to fetch schemas');
          setLoading(false);
        } else {
          console.log('获取Schema列表成功:', result);
          setSchemas(result.grid_schemas);
          // 通知父组件更新总数
          if (result.total_count) {
            onTotalItemsChange(result.total_count);
          } else {
            onTotalItemsChange(result.grid_schemas.length);
          }
          setLoading(false);
        }
        
        setTimeout(() => {
          if (actor) actor.remove();
          if (worker) worker.terminate();
        }, 100);
      }));
    } catch (err) {
      console.error('创建Worker失败:', err);
      setError(language === 'zh' ? '获取模板列表失败' : 'Failed to fetch schemas');
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchSchemas(currentPage);

    return () => {
      // 已在fetchSchemas中处理清理逻辑
    };
  }, [currentPage, itemsPerPage, language, onTotalItemsChange]);

  const items = schemas.map((schema) => ({
    title: schema.name,
    url: "#",
    schema: schema, // 保存schema数据以便在卡片中显示
    items: [
      {
        title: language === 'zh' ? "显示详情" : "Show Details",
        url: `#/schemas/${schema.name}`,
      },
      {
        title: language === 'zh' ? "基于此创建" : "Create From",
        url: `#/create-from/${schema.name}`,
      },
      {
        title: language === 'zh' ? "创建项目" : "Create Project",
        url: `#/project/new/${schema.name}`,
      },
    ],
  }))

  if (loading) {
    return (
      <SidebarGroup>
        <div className="p-4 text-center">
          {language === 'zh' ? '加载中...' : 'Loading...'}
        </div>
      </SidebarGroup>
    )
  }

  if (error) {
    return (
      <SidebarGroup>
        <div className="p-4 text-center text-red-500">
          {error}
        </div>
      </SidebarGroup>
    )
  }

  if (items.length === 0) {
    return (
      <SidebarGroup>
        <div className="p-4 text-center">
          {language === 'zh' ? '没有可用的模板' : 'No schemas available'}
        </div>
      </SidebarGroup>
    )
  }

  // 渲染卡片列表
  return (
    <div className="px-3">
      {items.map((item) => (
        <div 
          key={item.title}
          className="bg-white dark:bg-gray-800 rounded-lg shadow-md p-3 mb-4 border border-gray-200 dark:border-gray-700 relative"
        >
          {/* 卡片标题区域 */}
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-lg font-bold truncate">{item.title}</h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button 
                  className="h-8 w-8 p-0 rounded-md hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center justify-center"
                  aria-label={language === 'zh' ? "更多选项" : "More options"}
                  title={language === 'zh' ? "更多选项" : "More options"}
                >
                  <MoreHorizontal className="h-5 w-5" />
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent side="right" align="end" className="w-48">
                {item.items?.map((subItem) => (
                  <DropdownMenuItem key={subItem.title} asChild>
                    <a href={subItem.url} className="cursor-pointer">
                      {subItem.title}
                    </a>
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>

          {/* 卡片内容区域 */}
          <div className="text-sm space-y-2">
            {/* EPSG信息 */}
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Grid className="h-4 w-4 mr-2" />
              <span>EPSG: {item.schema?.epsg}</span>
            </div>
            
            {/* 基准点信息 */}
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <MapPin className="h-4 w-4 mr-2" />
              <span>
                {language === 'zh' ? '基准点' : 'Base Point'}: 
                {item.schema?.base_point ? 
                  ` [${item.schema.base_point[0].toFixed(2)}, ${item.schema.base_point[1].toFixed(2)}]` : 
                  ' -'
                }
              </span>
            </div>
            
            {/* 网格层级信息 */}
            <div className="flex items-center text-gray-600 dark:text-gray-300">
              <Layers className="h-4 w-4 mr-2" />
              <span>
                {language === 'zh' ? '网格层级' : 'Grid Levels'}: 
                {item.schema?.grid_info ? ` ${item.schema.grid_info.length}` : ' -'}
              </span>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
