import { useState } from 'react';
import { getGameState, updatePlayerMoney } from '../../gameState';
import { Console, useConsole } from './Console';

import { Button } from "../../components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../components/ui/dropdown-menu";
import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
  navigationMenuTriggerStyle,
} from "../../components/ui/navigation-menu";
import { Badge } from "../../components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../../components/ui/avatar";
import { cn } from "../../lib/utils";
import { MessageSquareText } from 'lucide-react';

interface TopBarProps {
  view: string;
  setView: (view: string) => void;
}

export default function TopBar({ view, setView }: TopBarProps) {
  const gameState = getGameState();
  const console = useConsole();
  
  return (
    <div className="w-full bg-wine text-white p-4 shadow-md">
      <div className="max-w-7xl mx-auto flex justify-between items-center">
        <div className="flex items-center space-x-6">
          <button onClick={() => setView('mainMenu')} className="text-xl font-bold">
            Winery Management
          </button>
          
          <NavigationMenu className="hidden md:flex">
            <NavigationMenuList>
              <NavigationMenuItem>
                <button
                  onClick={() => setView('mainMenu')}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent hover:bg-wine-dark focus:bg-wine-dark",
                    view === 'mainMenu' ? "bg-wine-dark" : ""
                  )}
                >
                  Main Menu
                </button>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <button
                  onClick={() => setView('vineyard')}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent hover:bg-wine-dark focus:bg-wine-dark",
                    view === 'vineyard' ? "bg-wine-dark" : ""
                  )}
                >
                  Vineyard
                </button>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <button
                  onClick={() => setView('production')}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent hover:bg-wine-dark focus:bg-wine-dark",
                    view === 'production' ? "bg-wine-dark" : ""
                  )}
                >
                  Production
                </button>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <button
                  onClick={() => setView('sales')}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent hover:bg-wine-dark focus:bg-wine-dark",
                    view === 'sales' ? "bg-wine-dark" : ""
                  )}
                >
                  Sales
                </button>
              </NavigationMenuItem>
              
              <NavigationMenuItem>
                <button
                  onClick={() => setView('finance')}
                  className={cn(
                    navigationMenuTriggerStyle(),
                    "bg-transparent hover:bg-wine-dark focus:bg-wine-dark",
                    view === 'finance' ? "bg-wine-dark" : ""
                  )}
                >
                  Finance
                </button>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </div>
        
        <div className="flex items-center space-x-4">
          <Badge variant="outline" className="bg-wine-light text-white border-wine-dark px-3 py-1 flex items-center">
            <span className="mr-1">€</span>
            <span className="font-medium">{gameState.player?.money?.toLocaleString() || 0}</span>
          </Badge>
          
          <Button 
            variant="ghost" 
            size="icon"
            onClick={() => console.openHistory()}
            className="rounded-full h-10 w-10 flex items-center justify-center"
          >
            <MessageSquareText className="h-5 w-5" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" className="flex items-center space-x-2 p-1 rounded-full h-10 w-10">
                <Avatar>
                  <AvatarImage src="/assets/icon/winery-icon.png" alt="Winery" />
                  <AvatarFallback className="bg-wine-dark text-white">WM</AvatarFallback>
                </Avatar>
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent className="w-56" align="end">
              <DropdownMenuLabel>
                {gameState.player?.companyName || 'My Winery'}
              </DropdownMenuLabel>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={() => setView('profile')}>
                Profile
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('settings')}>
                Settings
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('admin')}>
                Admin Dashboard
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('achievements')}>
                Achievements
              </DropdownMenuItem>
              <DropdownMenuItem onClick={() => setView('winepedia')}>
                Wine-Pedia
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                onClick={() => {
                  localStorage.removeItem('companyName');
                  setView('login');
                }}
                className="text-red-600 focus:text-red-500"
              >
                Logout
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      {/* Message History Modal - controlled by Console component */}
      {console.isHistoryOpen && 
        <Console 
          showConsole={true} 
          isOpen={console.isHistoryOpen} 
          onClose={console.closeHistory} 
        />
      }
    </div>
  );
} 