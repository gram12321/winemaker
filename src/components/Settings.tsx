import { useState, useEffect } from 'react';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from "./ui/card";
import { Switch } from "./ui/switch";
import { Label } from "./ui/label";
import { Button } from "./ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "./ui/select";
import { Separator } from "./ui/separator";

interface SettingsProps {
  view: string;
}

export default function Settings({ view }: SettingsProps) {
  const [timeFormat, setTimeFormat] = useState('24');
  const [showConsole, setShowConsole] = useState(false);
  const [landUnit, setLandUnit] = useState('acres');
  const [enableTutorials, setEnableTutorials] = useState(true);
  const [isSaved, setIsSaved] = useState(false);

  useEffect(() => {
    // Load saved settings from localStorage
    const savedFormat = localStorage.getItem('timeFormat') || '24';
    const savedUnit = localStorage.getItem('landUnit') || 'acres';
    const savedShowConsole = localStorage.getItem('showConsole') === 'true';
    const savedTutorials = localStorage.getItem('tutorialsEnabled') !== 'false'; // Default to true

    setTimeFormat(savedFormat);
    setLandUnit(savedUnit);
    setShowConsole(savedShowConsole);
    setEnableTutorials(savedTutorials);
  }, []);

  const handleSaveSettings = () => {
    // Save settings to localStorage
    localStorage.setItem('timeFormat', timeFormat);
    localStorage.setItem('landUnit', landUnit);
    localStorage.setItem('showConsole', showConsole.toString());
    localStorage.setItem('tutorialsEnabled', enableTutorials.toString());
    
    // Show saved message
    setIsSaved(true);
    setTimeout(() => setIsSaved(false), 2000);
  };

  // If this view is not active, don't render anything
  if (view !== 'settings') return null;

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Settings</h1>
      
      <Card className="max-w-2xl mx-auto">
        <CardHeader>
          <CardTitle>Game Settings</CardTitle>
          <CardDescription>Customize your winery management experience</CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Display Options</h3>
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="time-format" className="text-base">Time Format</Label>
                <p className="text-sm text-gray-500">Choose how time is displayed</p>
              </div>
              <Select value={timeFormat} onValueChange={setTimeFormat}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Time Format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="12">12-hour (AM/PM)</SelectItem>
                  <SelectItem value="24">24-hour</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="land-unit" className="text-base">Land Unit</Label>
                <p className="text-sm text-gray-500">Unit for measuring vineyard area</p>
              </div>
              <Select value={landUnit} onValueChange={setLandUnit}>
                <SelectTrigger className="w-40">
                  <SelectValue placeholder="Land Unit" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="acres">Acres</SelectItem>
                  <SelectItem value="hectares">Hectares</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="show-console" className="text-base">Show Console</Label>
                <p className="text-sm text-gray-500">Display console messages on screen</p>
              </div>
              <Switch 
                id="show-console" 
                checked={showConsole} 
                onCheckedChange={setShowConsole} 
              />
            </div>
          </div>
          
          <div className="space-y-4">
            <h3 className="text-lg font-medium">Tutorials & Help</h3>
            <Separator />
            
            <div className="flex items-center justify-between">
              <div>
                <Label htmlFor="enable-tutorials" className="text-base">Enable Tutorials</Label>
                <p className="text-sm text-gray-500">Show guide prompts for new players</p>
              </div>
              <Switch 
                id="enable-tutorials" 
                checked={enableTutorials} 
                onCheckedChange={setEnableTutorials} 
              />
            </div>
          </div>
        </CardContent>
        <CardFooter className="flex justify-between">
          {isSaved && <p className="text-green-600">Settings saved successfully!</p>}
          <Button onClick={handleSaveSettings} className="ml-auto">Save Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
} 