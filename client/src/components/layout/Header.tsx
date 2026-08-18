import { useState } from "react";
import { format, addDays, subDays, isSameDay } from "date-fns";
import { es } from "date-fns/locale";
import { ChevronLeft, ChevronRight, Calendar, RotateCcw, LogOut, Settings, FileText } from "lucide-react";
import { useApp } from "@/context/AppContext";
import { useAuth } from "@/hooks/use-auth";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar as CalendarComponent } from "@/components/ui/calendar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { SettingsDialog } from "@/components/settings/SettingsDialog";
import { AccountStatementDialog } from "@/components/account/AccountStatementDialog";

export function Header() {
  const { currentDate, setCurrentDate } = useApp();
  const { user, logout } = useAuth();
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [accountOpen, setAccountOpen] = useState(false);
  const dateObj = new Date(currentDate + "T12:00:00");
  const today = new Date();

  const handlePrevDay = () => {
    setCurrentDate(format(subDays(dateObj, 1), "yyyy-MM-dd"));
  };

  const handleNextDay = () => {
    setCurrentDate(format(addDays(dateObj, 1), "yyyy-MM-dd"));
  };

  const handleSelectDate = (date: Date | undefined) => {
    if (date) {
      setCurrentDate(format(date, "yyyy-MM-dd"));
    }
  };

  const isToday = isSameDay(dateObj, today);
  const userInitials = user?.firstName?.charAt(0) || user?.email?.charAt(0).toUpperCase() || "U";

  return (
    <>
      <div className="sticky top-0 z-50 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 border-b border-border shadow-sm">
        <div className="container max-w-md mx-auto px-4 py-3">
          <div className="flex items-center justify-between mb-2">
            <h1 className="text-xl font-bold text-primary">Gestión Remís</h1>
            
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="h-8 gap-2" data-testid="button-user-menu">
                  <Avatar className="h-6 w-6">
                    <AvatarImage src={user?.profileImageUrl || undefined} />
                    <AvatarFallback className="text-xs bg-primary text-primary-foreground">{userInitials}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium" data-testid="text-user-name">
                      {user?.firstName || "Usuario"}
                    </p>
                    <p className="text-xs text-muted-foreground" data-testid="text-user-email">
                      {user?.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => setSettingsOpen(true)} data-testid="button-settings">
                  <Settings className="mr-2 h-4 w-4" />
                  Configuración
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setAccountOpen(true)} data-testid="button-account-statement">
                  <FileText className="mr-2 h-4 w-4" />
                  Estado de Cuenta
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => logout()} className="text-red-600" data-testid="button-logout">
                  <LogOut className="mr-2 h-4 w-4" />
                  Cerrar Sesión
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="flex items-center justify-between w-full bg-card rounded-lg border border-input p-1 shadow-sm">
            <Button variant="ghost" size="icon" onClick={handlePrevDay} className="h-8 w-8 text-muted-foreground" data-testid="button-prev-day">
              <ChevronLeft className="h-5 w-5" />
            </Button>
            
            <Popover>
              <PopoverTrigger asChild>
                <Button variant="ghost" className="flex-1 font-semibold text-foreground text-base hover:bg-transparent" data-testid="button-date-picker">
                  <Calendar className="mr-2 h-4 w-4 text-primary" />
                  {format(dateObj, "EEEE d 'de' MMMM", { locale: es })}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="center">
                <CalendarComponent
                  mode="single"
                  selected={dateObj}
                  onSelect={handleSelectDate}
                  initialFocus
                  locale={es}
                />
              </PopoverContent>
            </Popover>

            <Button variant="ghost" size="icon" onClick={handleNextDay} className="h-8 w-8 text-muted-foreground" data-testid="button-next-day">
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>
          
          {!isToday && (
            <Button 
              variant="link" 
              size="sm" 
              onClick={() => setCurrentDate(format(today, "yyyy-MM-dd"))}
              className="h-6 mt-1 text-xs text-muted-foreground w-full"
              data-testid="button-today"
            >
              <RotateCcw className="mr-1 h-3 w-3" />
              Volver a Hoy
            </Button>
          )}
        </div>
      </div>
      
      <SettingsDialog open={settingsOpen} onOpenChange={setSettingsOpen} />
      <AccountStatementDialog open={accountOpen} onOpenChange={setAccountOpen} />
    </>
  );
}
