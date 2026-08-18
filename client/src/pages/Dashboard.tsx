import { useState } from "react";
import { Header } from "@/components/layout/Header";
import { BottomNav, TabType } from "@/components/layout/BottomNav";
import { TripList } from "@/components/trips/TripList";
import { ExpenseList } from "@/components/expenses/ExpenseList";
import { SummaryView } from "@/components/summary/SummaryView";
import { IncomeChart } from "@/components/charts/IncomeChart";

export function Dashboard() {
  const [activeTab, setActiveTab] = useState<TabType>('trips');

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <Header />
      
      <main className="flex-1 container max-w-md mx-auto px-4 py-4">
        {activeTab === 'trips' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <TripList />
          </div>
        )}
        
        {activeTab === 'expenses' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <ExpenseList />
          </div>
        )}
        
        {activeTab === 'summary' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <SummaryView />
          </div>
        )}
        
        {activeTab === 'charts' && (
          <div className="animate-in fade-in slide-in-from-bottom-2 duration-300">
            <IncomeChart />
          </div>
        )}
      </main>
      
      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}
