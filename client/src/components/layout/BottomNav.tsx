import { Car, Fuel, PieChart, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";

export type TabType = 'trips' | 'expenses' | 'summary' | 'charts';

interface BottomNavProps {
  activeTab: TabType;
  onTabChange: (tab: TabType) => void;
}

export function BottomNav({ activeTab, onTabChange }: BottomNavProps) {
  return (
    <div className="fixed bottom-0 left-0 right-0 bg-background border-t border-border z-50 pb-safe">
      <div className="flex justify-around items-center h-16">
        <button
          onClick={() => onTabChange('trips')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1",
            activeTab === 'trips' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Car className="h-5 w-5" />
          <span className="text-[10px] font-medium">Viajes</span>
        </button>
        
        <button
          onClick={() => onTabChange('expenses')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1",
            activeTab === 'expenses' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <Fuel className="h-5 w-5" />
          <span className="text-[10px] font-medium">Gastos</span>
        </button>
        
        <button
          onClick={() => onTabChange('summary')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1",
            activeTab === 'summary' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <PieChart className="h-5 w-5" />
          <span className="text-[10px] font-medium">Resumen</span>
        </button>
        
        <button
          onClick={() => onTabChange('charts')}
          className={cn(
            "flex flex-col items-center justify-center w-full h-full space-y-1",
            activeTab === 'charts' ? "text-primary" : "text-muted-foreground hover:text-foreground"
          )}
        >
          <BarChart3 className="h-5 w-5" />
          <span className="text-[10px] font-medium">Gráficos</span>
        </button>
      </div>
    </div>
  );
}
