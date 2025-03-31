import { useState } from 'react';
import { getAuth, onAuthStateChanged } from 'firebase/auth';
import { auth } from './firebase.config';

// Import future views here
// import MainMenu from './views/MainMenu';
// import Vineyard from './views/Vineyard';
// import Production from './views/Production';

function App() {
  const [view, setView] = useState<string>('login');
  const [user, setUser] = useState<any>(null);

  // Check authentication state
  onAuthStateChanged(auth, (currentUser) => {
    if (currentUser) {
      setUser(currentUser);
      if (view === 'login') {
        setView('mainMenu');
      }
    } else {
      setUser(null);
      setView('login');
    }
  });

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Login View */}
      {view === 'login' && (
        <div className="flex min-h-screen items-center justify-center">
          <div className="w-full max-w-md space-y-8 rounded-lg bg-white p-10 shadow-md">
            <h1 className="text-center text-3xl font-bold text-wine">Winery Management</h1>
            <p className="text-center text-gray-600">Please login to continue</p>
            {/* Login form will go here */}
            <button 
              className="w-full rounded bg-wine py-2 px-4 font-bold text-white hover:bg-wine-dark"
              onClick={() => console.log('Login functionality to be implemented')}
            >
              Login
            </button>
          </div>
        </div>
      )}
      
      {/* Main Menu View */}
      {view === 'mainMenu' && (
        <div>
          <h1>Main Menu</h1>
          {/* Main menu components will go here */}
        </div>
      )}
      
      {/* Other views will be conditionally rendered here */}
    </div>
  );
}

export default App; 