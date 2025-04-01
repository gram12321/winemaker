import { useState, useEffect } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../components/ui/tabs";
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardHeader, 
  CardTitle 
} from "../components/ui/card";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "../components/ui/table";
import { Badge } from "../components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "../components/ui/select";

interface WinepediaProps {
  view: string;
}

export default function Winepedia({ view }: WinepediaProps) {
  const [activeTab, setActiveTab] = useState('grapeVarieties');
  const [countryFilter, setCountryFilter] = useState('');
  const [importers, setImporters] = useState<Array<{
    country: string;
    name: string;
    type: string;
    marketShare: number;
    purchasingPower: number;
    wineTradition: number;
    relationship: number;
  }>>([]);

  useEffect(() => {
    // Simulate loading importers data
    const mockImporters = [
      { 
        country: 'France', 
        name: 'French Luxury Wines', 
        type: 'Distributor', 
        marketShare: 15.5, 
        purchasingPower: 0.85, 
        wineTradition: 0.95,
        relationship: 75
      },
      { 
        country: 'Germany', 
        name: 'Berlin Fine Wines', 
        type: 'Restaurant Chain', 
        marketShare: 8.2, 
        purchasingPower: 0.70, 
        wineTradition: 0.65,
        relationship: 60
      },
      { 
        country: 'Italy', 
        name: 'Milano Enoteca', 
        type: 'Wine Shop', 
        marketShare: 12.3, 
        purchasingPower: 0.75, 
        wineTradition: 0.90,
        relationship: 70
      },
      { 
        country: 'United States', 
        name: 'California Wine Imports', 
        type: 'Importer', 
        marketShare: 18.7, 
        purchasingPower: 0.90, 
        wineTradition: 0.60,
        relationship: 65
      },
      { 
        country: 'Spain', 
        name: 'Barcelona Vinos', 
        type: 'Restaurant', 
        marketShare: 9.8, 
        purchasingPower: 0.65, 
        wineTradition: 0.80,
        relationship: 55
      }
    ];
    
    setImporters(mockImporters);
  }, []);

  // If this view is not active, don't render anything
  if (view !== 'winepedia') return null;

  // Mock grape varieties
  const grapeVarieties = [
    {
      name: 'Barbera',
      description: 'A versatile grape known for high acidity and moderate tannins, producing medium-bodied wines.'
    },
    {
      name: 'Chardonnay',
      description: 'A noble grape variety producing aromatic, medium-bodied wines with moderate acidity.'
    },
    {
      name: 'Pinot Noir',
      description: 'A delicate grape creating light-bodied, aromatic wines with high acidity and soft tannins.'
    },
    {
      name: 'Primitivo',
      description: 'A robust grape yielding full-bodied, aromatic wines with natural sweetness and high tannins.'
    },
    {
      name: 'Sauvignon Blanc',
      description: 'A crisp grape variety producing aromatic, light-bodied wines with high acidity.'
    }
  ];

  const getCountryCode = (country: string): string => {
    const countryCodeMap: {[key: string]: string} = {
      'France': 'fr',
      'Germany': 'de',
      'Italy': 'it',
      'Spain': 'es',
      'United States': 'us'
    };
    return countryCodeMap[country] || 'unknown';
  };

  const formatRelationship = (value: number): JSX.Element => {
    let colorClass = '';
    
    if (value >= 80) colorClass = 'bg-green-100 text-green-800';
    else if (value >= 60) colorClass = 'bg-green-50 text-green-600';
    else if (value >= 40) colorClass = 'bg-yellow-100 text-yellow-800';
    else colorClass = 'bg-red-100 text-red-800';
    
    return <Badge variant="outline" className={colorClass}>{value.toFixed(1)}</Badge>;
  };

  const filteredImporters = countryFilter
    ? importers.filter(importer => importer.country === countryFilter)
    : importers;

  const uniqueCountries = [...new Set(importers.map(imp => imp.country))];

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">Wine-Pedia</h1>
      
      <Tabs defaultValue="grapeVarieties" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="grapeVarieties">Grape Varieties</TabsTrigger>
          <TabsTrigger value="wineRegions">Wine Regions</TabsTrigger>
          <TabsTrigger value="winemaking">Winemaking</TabsTrigger>
          <TabsTrigger value="importers">Importers</TabsTrigger>
        </TabsList>
        
        <TabsContent value="grapeVarieties">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {grapeVarieties.map((grape, index) => (
              <Card key={index} className="hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="flex flex-row items-center gap-4 pb-2">
                  <div className="w-12 h-12 bg-wine/10 rounded-full flex items-center justify-center">
                    <span className="text-wine font-bold">{grape.name.charAt(0)}</span>
                  </div>
                  <CardTitle>{grape.name}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{grape.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
        
        <TabsContent value="wineRegions">
          <Card>
            <CardHeader>
              <CardTitle>Wine Regions</CardTitle>
              <CardDescription>Learn about different wine regions around the world</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Content coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="winemaking">
          <Card>
            <CardHeader>
              <CardTitle>Winemaking Process</CardTitle>
              <CardDescription>Understand the steps involved in creating fine wines</CardDescription>
            </CardHeader>
            <CardContent>
              <p className="text-gray-600">Content coming soon...</p>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="importers">
          <Card>
            <CardHeader>
              <CardTitle>Wine Importers Directory</CardTitle>
              <CardDescription>Global wine importers and their relationships</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="mb-4">
                <Select value={countryFilter} onValueChange={setCountryFilter}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="All Countries" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Countries</SelectItem>
                    {uniqueCountries.map((country, index) => (
                      <SelectItem key={index} value={country}>{country}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="rounded-md border">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Country</TableHead>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Market Share</TableHead>
                      <TableHead>Purchasing Power</TableHead>
                      <TableHead>Wine Tradition</TableHead>
                      <TableHead>Relationship</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredImporters.map((importer, index) => (
                      <TableRow key={index}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <span>{importer.country}</span>
                          </div>
                        </TableCell>
                        <TableCell>{importer.name}</TableCell>
                        <TableCell>{importer.type}</TableCell>
                        <TableCell>{importer.marketShare.toFixed(1)}%</TableCell>
                        <TableCell>{(importer.purchasingPower * 100).toFixed(0)}%</TableCell>
                        <TableCell>{(importer.wineTradition * 100).toFixed(0)}%</TableCell>
                        <TableCell>{formatRelationship(importer.relationship)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
} 