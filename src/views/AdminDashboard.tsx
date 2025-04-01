import { useState } from 'react';
import { Button } from '../components/ui/button';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { Separator } from '../components/ui/separator';
import { Alert, AlertDescription, AlertTitle } from '../components/ui/alert';
import { AlertCircle } from 'lucide-react';
import { clearGameStorage } from '../lib/database/storageService';
import { deleteAllCompanies } from '../lib/database/companyService';
import { saveGameState } from '../lib/database/gameStateService';

interface AdminDashboardProps {
  view: string;
}

export default function AdminDashboard({ view }: AdminDashboardProps) {
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [isLoading, setIsLoading] = useState<{
    clearStorage: boolean;
    clearFirestore: boolean;
    saveCompanyInfo: boolean;
  }>({
    clearStorage: false,
    clearFirestore: false,
    saveCompanyInfo: false
  });

  if (view !== 'admin') return null;

  const clearLocalStorage = async () => {
    try {
      setIsLoading(prev => ({ ...prev, clearStorage: true }));
      
      // Clear all game-related data using our new service
      clearGameStorage();
      
      setMessage({ type: 'success', text: 'Local storage cleared successfully.' });
    } catch (error) {
      console.error('Error clearing local storage:', error);
      setMessage({ type: 'error', text: 'Error clearing local storage.' });
    } finally {
      setIsLoading(prev => ({ ...prev, clearStorage: false }));
    }
  };

  const clearFirestore = async () => {
    if (!confirm('Are you sure you want to delete all companies from Firestore?')) return;
    
    try {
      setIsLoading(prev => ({ ...prev, clearFirestore: true }));
      
      // Delete all companies using our new service
      await deleteAllCompanies();
      
      setMessage({ type: 'success', text: 'Firestore data cleared successfully.' });
    } catch (error) {
      console.error('Error clearing Firestore:', error);
      setMessage({ type: 'error', text: 'Error clearing Firestore data.' });
    } finally {
      setIsLoading(prev => ({ ...prev, clearFirestore: false }));
    }
  };

  const saveCompanyInfo = async () => {
    try {
      setIsLoading(prev => ({ ...prev, saveCompanyInfo: true }));
      
      // Save game state using our new service
      const success = await saveGameState();
      
      if (success) {
        setMessage({ type: 'success', text: 'Company info saved successfully.' });
      } else {
        setMessage({ type: 'error', text: 'No company found to save.' });
      }
    } catch (error) {
      console.error('Error saving company info:', error);
      setMessage({ type: 'error', text: 'Error saving company info.' });
    } finally {
      setIsLoading(prev => ({ ...prev, saveCompanyInfo: false }));
    }
  };

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Admin Dashboard</h1>
      
      {message && (
        <Alert variant={message.type === 'error' ? 'destructive' : 'default'} className="mb-6">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>{message.type === 'error' ? 'Error' : 'Success'}</AlertTitle>
          <AlertDescription>{message.text}</AlertDescription>
        </Alert>
      )}
      
      <Card>
        <CardHeader>
          <CardTitle>Game Data Management</CardTitle>
          <CardDescription>
            Advanced options for managing game data. Use with caution!
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Local Storage</h3>
            <p className="text-sm text-gray-500">
              Clear all locally stored game data from this browser. This action cannot be undone.
            </p>
            <Button 
              variant="destructive" 
              onClick={clearLocalStorage} 
              disabled={isLoading.clearStorage}
            >
              {isLoading.clearStorage ? 'Clearing...' : 'Clear Local Storage'}
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Firestore Database</h3>
            <p className="text-sm text-gray-500">
              Delete all company data from the Firestore database. This affects all users.
            </p>
            <Button 
              variant="destructive" 
              onClick={clearFirestore}
              disabled={isLoading.clearFirestore}
            >
              {isLoading.clearFirestore ? 'Clearing...' : 'Clear Firestore'}
            </Button>
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <h3 className="text-lg font-medium">Save Current Game</h3>
            <p className="text-sm text-gray-500">
              Save the current game state to the Firestore database.
            </p>
            <Button 
              onClick={saveCompanyInfo}
              disabled={isLoading.saveCompanyInfo}
            >
              {isLoading.saveCompanyInfo ? 'Saving...' : 'Save Company Info'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
} 