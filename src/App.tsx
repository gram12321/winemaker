import { useState, useEffect } from 'react';
import { db } from './firebase.config';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { getGameState, updateGameState, initializePlayer } from './gameState';
import TopBar from './components/TopBar';
import Settings from './components/Settings';
import AdminDashboard from './components/AdminDashboard';
import Winepedia from './components/Winepedia';
import Profile from './components/Profile';
import Achievements from './components/Achievements';

// Import future views here
// import MainMenu from './views/MainMenu';
// import Vineyard from './views/Vineyard';
// import Production from './views/Production';

function App() {
  const [view, setView] = useState<string>('login');
  const [companyName, setCompanyName] = useState<string>('');
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Check if user is already logged in (company name in localStorage)
    const savedCompanyName = localStorage.getItem('companyName');
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
      // Check if company exists in Firestore
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

  const checkCompanyExists = async (name: string): Promise<boolean> => {
    const docRef = doc(db, 'companies', name);
    const docSnap = await getDoc(docRef);
    return docSnap.exists();
  };

  const loadCompanyData = async (name: string) => {
    const docRef = doc(db, 'companies', name);
    const docSnap = await getDoc(docRef);

    if (docSnap.exists()) {
      const data = docSnap.data();
      
      // Update localStorage with company data
      localStorage.setItem('companyName', name);
      
      // Update gameState with loaded data
      updateGameState({
        player: data.player || null,
        farmlands: data.farmlands || [],
        buildings: data.buildings || [],
        staff: data.staff || [],
        wineBatches: data.wineBatches || [],
        currentDay: data.currentDay || 1,
        currentYear: data.currentYear || 2023,
        currentView: 'mainMenu',
      });
      
      setView('mainMenu');
    }
  };

  const createNewCompany = async (name: string) => {
    // Initialize new player with company name
    const player = initializePlayer('Owner', name);
    
    // Update gameState
    updateGameState({
      player,
      currentView: 'mainMenu',
    });
    
    // Save to Firestore
    const docRef = doc(db, 'companies', name);
    await setDoc(docRef, {
      player,
      farmlands: [],
      buildings: [],
      staff: [],
      wineBatches: [],
      currentDay: 1,
      currentYear: 2023,
    });
    
    // Save to localStorage
    localStorage.setItem('companyName', name);
  };

  return (
    <div className="min-h-screen bg-gray-100">
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
                    onClick={() => setView('production')}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-wine mb-2">Production</h2>
                    <p className="text-gray-600">Process grapes, ferment wine, and manage aging and bottling</p>
                  </div>
                  
                  <div 
                    onClick={() => setView('staff')}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-wine mb-2">Staff</h2>
                    <p className="text-gray-600">Hire, train, and manage your winery staff</p>
                  </div>
                  
                  <div 
                    onClick={() => setView('buildings')}
                    className="bg-white rounded-lg shadow-md p-6 cursor-pointer hover:shadow-lg transition-shadow"
                  >
                    <h2 className="text-xl font-semibold text-wine mb-2">Buildings</h2>
                    <p className="text-gray-600">Build and upgrade your winery facilities</p>
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
            
            {/* Game Views */}
            {view === 'vineyard' && (
              <div>
                <h1 className="text-2xl font-bold mb-4">Vineyard Management</h1>
                {/* Vineyard content will go here */}
                <p className="text-gray-600">Vineyard view coming soon...</p>
              </div>
            )}
            
            {view === 'production' && (
              <div>
                <h1 className="text-2xl font-bold mb-4">Wine Production</h1>
                {/* Production content will go here */}
                <p className="text-gray-600">Production view coming soon...</p>
              </div>
            )}
            
            {view === 'staff' && (
              <div>
                <h1 className="text-2xl font-bold mb-4">Staff Management</h1>
                {/* Staff content will go here */}
                <p className="text-gray-600">Staff management view coming soon...</p>
              </div>
            )}
            
            {view === 'sales' && (
              <div>
                <h1 className="text-2xl font-bold mb-4">Wine Sales</h1>
                {/* Sales content will go here */}
                <p className="text-gray-600">Sales view coming soon...</p>
              </div>
            )}
            
            {view === 'finance' && (
              <div>
                <h1 className="text-2xl font-bold mb-4">Financial Management</h1>
                {/* Finance content will go here */}
                <p className="text-gray-600">Finance view coming soon...</p>
              </div>
            )}
            
            {view === 'buildings' && (
              <div>
                <h1 className="text-2xl font-bold mb-4">Buildings</h1>
                {/* Buildings content will go here */}
                <p className="text-gray-600">Buildings view coming soon...</p>
              </div>
            )}
            
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