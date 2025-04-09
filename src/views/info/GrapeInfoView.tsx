import React, { useState } from 'react';
import { GrapeVariety, getResourceByGrapeVariety, GRAPE_SUITABILITY, COUNTRY_REGION_MAP } from '@/lib/core/constants/vineyardConstants';
import { formatPercentage, getColorClass } from '@/lib/core/utils/formatUtils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { formatNumber } from '@/lib/core/utils/formatUtils';

// --- CharacteristicBar Component (Defined Inline) ---
interface CharacteristicBarProps {
  trait: string;
  value: number; // Expected base characteristic value (-0.2 to 0.3 range)
}

const CharacteristicBar: React.FC<CharacteristicBarProps> = ({ trait, value }) => {
  // Convert base value (-0.2 to 0.3) to display value (0.3 to 0.8, then scale to 0-1)
  const displayValueRaw = 0.5 + value;
  // Clamp display value between 0 and 1 for the bar width
  const displayValueClamped = Math.max(0, Math.min(1, displayValueRaw)); 
  const percentage = (displayValueClamped * 100).toFixed(0);

  return (
    <div className="flex items-center py-2 border-b last:border-b-0 border-gray-200">
      <div className="w-1/4 pr-2 text-sm font-medium text-gray-700 capitalize">
        {/* TODO: Add icons later if desired */}
        {trait}
      </div>
      <div className="w-3/4 flex items-center">
        <div className="relative w-full h-2 bg-gray-200 rounded-full overflow-hidden">
          {/* Background bar */}
          <div 
            className="absolute top-0 left-0 h-full bg-wine rounded-full" 
            style={{ width: `${percentage}%` }}
          ></div>
          {/* Optional: Balanced range marker (example: 40%-60%) */}
          {/* <div className="absolute top-0 h-full bg-green-600 opacity-30" style={{ left: `40%`, width: `20%` }}></div> */}
          {/* Value Marker (as a thin line) */}
          <div 
            className="absolute top-0 bottom-0 w-0.5 bg-black opacity-50"
            style={{ left: `${percentage}%` }}
          ></div>
        </div>
        <span className="ml-3 text-sm font-medium text-gray-700 w-12 text-right">
          {percentage}%
        </span>
      </div>
    </div>
  );
};
// --- End CharacteristicBar Component ---

interface GrapeInfoViewProps {
  grapeName: GrapeVariety;
  onClose: () => void; // Function to close this view/modal
}

export const GrapeInfoView: React.FC<GrapeInfoViewProps> = ({ grapeName, onClose }) => {
  const resource = getResourceByGrapeVariety(grapeName);
  const [selectedCountry, setSelectedCountry] = useState<string>(Object.keys(COUNTRY_REGION_MAP)[0]);

  if (!resource) {
    return (
      <div className="p-4 text-center text-red-600">
        Error: Grape variety "{grapeName}" not found.
        <Button onClick={onClose} variant="outline" size="sm" className="ml-4">Close</Button>
      </div>
    );
  }

  const baseInfo = [
    { label: 'Grape Color', value: resource.grapeColor, valueClass: 'capitalize' },
    { label: 'Natural Yield', value: formatPercentage(resource.naturalYield), valueClass: getColorClass(resource.naturalYield) },
    { label: 'Grape Fragile', value: formatPercentage(resource.fragile), valueClass: getColorClass(1 - resource.fragile) }, // Invert for fragility display
    { label: 'Oxidation Prone', value: formatPercentage(resource.proneToOxidation), valueClass: getColorClass(1 - resource.proneToOxidation) }, // Invert for resistance display
  ];

  const characteristics = resource.baseCharacteristics || {};
  const suitabilityData = GRAPE_SUITABILITY[selectedCountry as keyof typeof GRAPE_SUITABILITY] || {};
  const regions = COUNTRY_REGION_MAP[selectedCountry as keyof typeof COUNTRY_REGION_MAP] || [];

  return (
    <Card className="w-full max-w-4xl mx-auto my-4 shadow-lg">
      <CardHeader className="flex flex-row justify-between items-center border-b pb-4">
        <div className="flex items-center">
          {/* Placeholder for grape image */}
          {/* <img src={`/assets/icon/grape/icon_${resource.name.toLowerCase()}.webp`} alt={resource.name} className="w-12 h-12 mr-4"/> */}
          <CardTitle className="text-2xl font-bold text-wine">{resource.name}</CardTitle>
        </div>
        <Button onClick={onClose} variant="ghost" size="sm">✕</Button>
      </CardHeader>
      <CardContent className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Base Information */}
        <div className="space-y-2">
          <h3 className="text-lg font-semibold mb-2 text-wine-dark">Base Information</h3>
          <table className="w-full text-sm">
            <tbody>
              {baseInfo.map(info => (
                <tr key={info.label} className="border-b last:border-b-0">
                  <td className="py-2 pr-4 text-gray-600">{info.label}</td>
                  <td className={`py-2 font-medium ${info.valueClass || ''}`}>{info.value}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Grape Characteristics */}
        <div className="space-y-1">
          <h3 className="text-lg font-semibold mb-2 text-wine-dark">Grape Characteristics</h3>
          {Object.entries(characteristics).map(([trait, value]) => (
            <CharacteristicBar key={trait} trait={trait} value={value} />
          ))}
        </div>

        {/* Regional Suitability */}
        <div className="md:col-span-2 space-y-3">
          <h3 className="text-lg font-semibold text-wine-dark">Regional Suitability</h3>
          <div className="flex flex-wrap gap-2 border-b pb-3 mb-3">
            {Object.keys(COUNTRY_REGION_MAP).map(country => (
              <Button 
                key={country} 
                variant={selectedCountry === country ? 'default' : 'outline'} 
                size="sm"
                onClick={() => setSelectedCountry(country)}
                className={selectedCountry === country ? 'bg-wine hover:bg-wine-dark' : ''}
              >
                {country}
              </Button>
            ))}
          </div>
          <table className="w-full text-sm">
            <tbody>
              {regions.map(region => {
                const regionSuitability = suitabilityData[region as keyof typeof suitabilityData];
                const suitabilityValue = regionSuitability ? (regionSuitability[grapeName as keyof typeof regionSuitability] ?? 0) : 0;
                return (
                  <tr key={region} className="border-b last:border-b-0">
                    <td className="py-2 pr-4 w-2/3">{region}</td>
                    <td className={`py-2 font-medium text-right ${getColorClass(suitabilityValue)}`}>
                      {formatPercentage(suitabilityValue)}
                    </td>
                  </tr>
                );
              })}
              {regions.length === 0 && (
                <tr><td colSpan={2} className="text-center text-gray-500 py-4">No regions found for {selectedCountry}.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </CardContent>
    </Card>
  );
}; 