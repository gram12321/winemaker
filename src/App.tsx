import React, { useState, useEffect } from 'react';
import './styles/globals.css';
import { getGameState, updateGameState, initializePlayer } from './gameState';

// Import database services
import { checkCompanyExists, createCompany } from './lib/database/companyDB';
import { loadGameState } from './lib/database/gameStateDB';
import { StorageKeys, loadFromStorage } from './lib/database/localStorageDB';
import { initializeToolInstanceCountsFromStorage } from './lib/database/buildingDB';
import { initializeActivitySystem } from './lib/database/activityDB';
import { initializeGameTime } from '@/lib/game/gameTick';
import TopBar from './components/layout/TopBar';
import { Toaster } from './components/ui/toaster';
import { consoleService } from './components/layout/Console';
import Settings from './views/Settings';
import AdminDashboard from './views/AdminDashboard';
import Winepedia from './views/Winepedia';
import Profile from './views/Profile';
import Achievements from './views/Achievements';
import { VineyardView, InventoryView, BuildingsView } from './views';
import StaffView from './views/StaffView';
import FinanceView from './views/FinanceView';
import { createStaff, type Nationality } from './services/staffService';

function App() {
  const [view, setView] = useState<string>('login');
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in (company name in localStorage)
    const savedCompanyName = loadFromStorage<string | null>(StorageKeys.COMPANY_NAME, null);
    if (savedCompanyName) {
      loadCompanyData(savedCompanyName);
    }
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!companyName.trim()) {
      setError('Please enter a company name');
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Check if company exists in Firestore using our new service
      const companyExists = await checkCompanyExists(companyName);
      
      if (companyExists) {
        // Company exists, load data
        await loadCompanyData(companyName);
      } else {
        // New company, create it
        await createNewCompany(companyName);
      }
      
      // Set view to main menu
      setView('mainMenu');
    } catch (err) {
      setError('An error occurred. Please try again.');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const loadCompanyData = async (name: string) => {
    try {
      // Use our new service to load game state
      const success = await loadGameState(name);
      
      if (success) {
        // Initialize game time system
        initializeGameTime();
        
        // Initialize tool instance counts from storage to avoid duplicates
        await initializeToolInstanceCountsFromStorage();
        
        // Initialize activity system to ensure persistence
        await initializeActivitySystem();
        
        // Show welcome back message
        consoleService.info(`Welcome back to ${name}! Your winery awaits.`);
        setView('mainMenu');
      } else {
        setError('Failed to load company data.');
      }
    } catch (error) {
      console.error('Error loading company data:', error);
      setError('An error occurred while loading company data.');
    }
  };

  const createNewCompany = async (name: string) => {
    // Initialize new player with company name
    const player = initializePlayer('Owner', name);
    
    // Create initial starting staff
    const initialStaff = [
      createInitialStaff('General Worker', 0.3),
      createInitialStaff('Vineyard Manager', 0.3, 'field')
    ];
    
    // Update gameState
    updateGameState({
      player,
      staff: initialStaff,
      currentView: 'mainMenu',
    });
    
    // Initialize game time
    initializeGameTime();
    
    // Initialize activity system
    await initializeActivitySystem();
    
    // Use our new service to create the company
    await createCompany(name, player, initialStaff);
    
    // Show welcome message for new company
    consoleService.info(`Welcome to your new winery, ${name}! Let's begin your winemaking journey.`);
  };

  function createInitialStaff(type: string, skillLevel: number, specialization: string | null = null) {
    // Generate first and last names based on type
    let firstName, lastName;
    let nationality: Nationality;
    
    if (type === 'Vineyard Manager') {
      firstName = ['Marco', 'Sofia', 'Giovanni', 'Isabella', 'Paolo'][Math.floor(Math.random() * 5)];
      lastName = ['Rossi', 'Bianchi', 'Romano', 'Esposito', 'Ferrari'][Math.floor(Math.random() * 5)];
      nationality = 'Italy';
    } else {
      firstName = ['Thomas', 'Emma', 'Luis', 'Anna', 'James'][Math.floor(Math.random() * 5)];
      lastName = ['Smith', 'Johnson', 'Garcia', 'Martin', 'Wilson'][Math.floor(Math.random() * 5)];
      nationality = 'United States';
    }
    
    // Generate skills with appropriate specialization
    const specializations = specialization ? [specialization] : [];
    
    // Create and return staff member
    return createStaff(firstName, lastName, skillLevel, specializations, nationality);
  }

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Toast notifications */}
      <Toaster />
      
      {/* Login View */}
      {view === 'login' && (
        <div className="flex min-h-screen items-center justify-center" 
             style={{
               backgroundImage: 'url("/assets/bg/loginbg.webp")', 
               backgroundSize: 'cover',
               backgroundPosition: 'center',
             }}>
          <div className="w-full max-w-md space-y-6 rounded-lg bg-white/90 p-8 shadow-lg backdrop-blur-sm">
            <h1 className="text-center text-3xl font-bold text-wine">Winery Management</h1>
            <p className="text-center text-gray-600">Enter your company name to continue</p>
            
            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label htmlFor="company-name" className="block text-sm font-medium text-gray-700">
                  Company Name
                </label>
                <input
                  id="company-name"
                  type="text"
                  value={companyName}
                  onChange={(e) => setCompanyName(e.target.value)}
                  className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 shadow-sm focus:border-wine focus:outline-none focus:ring-wine"
                  placeholder="Enter company name"
                  required
                />
              </div>
              
              {error && (
                <p className="text-center text-sm text-red-600">{error}</p>
              )}
              
              <button
                type="submit"
                disabled={loading}
                className="w-full rounded bg-wine py-2 px-4 font-bold text-white hover:bg-wine-dark disabled:bg-gray-400"
              >
                {loading ? 'Loading...' : 'Continue'}
              </button>
            </form>
          </div>
        </div>
      )}
      
      {/* Main Content with TopBar */}
      {view !== 'login' && (
        <div className="flex flex-col min-h-screen">
          <TopBar view={view} setView={setView} />
          
          <div className="flex-1 p-6">
            {/* Main Menu View */}
            {view === 'mainMenu' && (
              <div className="max-w-7xl mx-auto">
                <h1 className="text-3xl font-bold mb-6">Welcome to Your Winery</h1>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  <div 
                    onClick={() => setView('vineyard')}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-wine mb-2">Vineyard</h2>
                    <p className="text-gray-600">Manage your vineyards, plant new grapes, and harvest your crops</p>
                  </div>
                  
                  <div 
                    onClick={() => setView('inventory')}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-wine mb-2">Inventory</h2>
                    <p className="text-gray-600">Manage your harvested grapes, must, and bottled wine</p>
                  </div>
                  
                  <div 
                    onClick={() => setView('buildings')}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-wine mb-2">Buildings</h2>
                    <p className="text-gray-600">Manage your winery buildings and facilities</p>
                  </div>
                  
                  <div 
                    onClick={() => setView('staff')}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-wine mb-2">Staff</h2>
                    <p className="text-gray-600">Hire and manage your winery staff</p>
                  </div>
                  
                  <div 
                    onClick={() => setView('sales')}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-wine mb-2">Sales</h2>
                    <p className="text-gray-600">Sell your wine to importers and manage contracts</p>
                  </div>
                  
                  <div 
                    onClick={() => setView('finance')}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-wine mb-2">Finance</h2>
                    <p className="text-gray-600">Track income, expenses, and manage your finances</p>
                  </div>
                </div>
              </div>
            )}
            
            {/* View Components */}
            {view === 'vineyard' && <VineyardView />}
            {view === 'inventory' && <InventoryView />}
            {view === 'buildings' && <BuildingsView />}
            {view === 'staff' && <StaffView />}
            {view === 'sales' && (
              <div>
                <h1 className="text-2xl font-bold mb-4">Wine Sales</h1>
                <p className="text-gray-600">Sales view coming soon...</p>
              </div>
            )}
            {view === 'finance' && <FinanceView />}
            
            {/* Additional Menu Views */}
            <Settings view={view} />
            <AdminDashboard view={view} />
            <Winepedia view={view} />
            <Profile view={view} />
            <Achievements view={view} />
          </div>
        </div>
      )}
    </div>
  );
}

export default App; 