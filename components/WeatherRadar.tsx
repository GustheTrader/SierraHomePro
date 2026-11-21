import React, { useState, useEffect } from 'react';
import { ConstructionProject } from '../types';
import { 
  Cloud, CloudRain, CloudLightning, CloudSnow, Sun, Wind, 
  Thermometer, AlertTriangle, RefreshCw, Loader2, CheckCircle2, MapPin
} from 'lucide-react';

interface WeatherRadarProps {
  projects: ConstructionProject[];
}

interface ProjectWeatherData {
  projectId: string;
  projectName: string;
  location: string;
  temp: number;
  windSpeed: number;
  weatherCode: number;
  description: string;
  impactLevel: 'low' | 'medium' | 'high';
  impactText: string;
  alerts: Array<{
    event: string;
    severity: string;
    headline: string;
    description: string;
  }>;
  laborImpact: string;
  materialImpact: string;
}

type SimulationMode = 'live' | 'tahoe-freeze' | 'zephyr-wind' | 'summer-heat';

export const WeatherRadar: React.FC<WeatherRadarProps> = ({ projects }) => {
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [simulationMode, setSimulationMode] = useState<SimulationMode>('live');
  const [weatherData, setWeatherData] = useState<Record<string, ProjectWeatherData>>({});
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  const getCoordinates = (project: ConstructionProject) => {
    if (project.latitude !== undefined && project.longitude !== undefined) {
      return {
        lat: project.latitude,
        lon: project.longitude,
        name: project.locationName || 'Sparks, NV'
      };
    }
    const lower = (project.locationName || project.name).toLowerCase();
    if (lower.includes('tahoe') || lower.includes('incline')) {
      return { lat: 39.2513, lon: -119.9729, name: 'Lake Tahoe, NV' };
    }
    if (lower.includes('carson')) {
      return { lat: 39.1638, lon: -119.7674, name: 'Carson City, NV' };
    }
    if (lower.includes('sparks') || lower.includes('wingfield')) {
      return { lat: 39.5912, lon: -119.7014, name: 'Sparks, NV' };
    }
    return { lat: 39.5296, lon: -119.8138, name: 'Reno, NV' };
  };

  const getWeatherDescription = (code: number): string => {
    if (code === 0) return 'Clear Sky';
    if (code >= 1 && code <= 3) return 'Partly Cloudy';
    if (code === 45 || code === 48) return 'Valley Fog';
    if (code >= 51 && code <= 67) return 'Rain Showers';
    if (code >= 71 && code <= 86) return 'Mountain Snow';
    if (code >= 95) return 'Thunderstorms';
    return 'Overcast';
  };

  const getWeatherIcon = (code: number, size = 22) => {
    if (code === 0) return <Sun size={size} className="text-amber-400" />;
    if (code >= 1 && code <= 3) return <Cloud size={size} className="text-zinc-400" />;
    if (code >= 51 && code <= 67) return <CloudRain size={size} className="text-sky-400" />;
    if (code >= 71 && code <= 86) return <CloudSnow size={size} className="text-sky-300" />;
    if (code >= 95) return <CloudLightning size={size} className="text-amber-400" />;
    return <Cloud size={size} className="text-zinc-400" />;
  };

  const generateDynamicImpact = (temp: number, wind: number, code: number, category?: string) => {
    let impactLevel: 'low' | 'medium' | 'high' = 'low';
    let impactText = 'Good conditions for both indoor repairs and exterior painting or maintenance.';
    let laborImpact = 'All service vans operating on normal arrival windows across Reno–Sparks, Carson City, and Tahoe.';
    let materialImpact = 'Exterior paints, caulks, and wood stains cure cleanly within manufacturer spec.';

    if (temp > 95) {
      impactLevel = 'medium';
      impactText = 'High Heat Advisory — avoid direct-sun exterior painting.';
      laborImpact = 'Shift exterior siding/trim painting to early morning (7 AM – 11 AM); move midday visits to indoor smart-home or handyman jobs.';
      materialImpact = 'Latex exterior paint dries too quickly on sun-baked trim; store caulk and adhesives inside shaded van bins.';
    } else if (temp < 40) {
      impactLevel = category === 'Interior/Exterior Painting' ? 'high' : 'medium';
      impactText = 'Cold-Weather Advisory — exterior paint cure & pipe freeze risk.';
      laborImpact = 'Pause exterior trim & deck staining below 40°F unless using low-temp formula. Prioritize indoor senior safety installs and winterization visits.';
      materialImpact = 'Keep water-based primers, paints, and spackle out of unheated vans overnight to prevent freezing.';
    }

    if (wind > 22) {
      impactLevel = impactLevel === 'high' ? 'high' : 'medium';
      impactText = 'Washoe Zephyr Wind Advisory — extension ladder caution.';
      laborImpact = 'Suspend 2-story exterior gutter cleaning, roofline camera mounts, and exterior spray painting until gusts drop below 20 mph.';
      materialImpact = 'Secure drop cloths, tarps, and lightweight trim materials when staging outside homeowner garages.';
    }

    if (code >= 51 && code <= 67) {
      impactLevel = 'medium';
      impactText = 'Rain / Wet Surfaces — pause exterior deck & trim coats.';
      laborImpact = 'Reassign exterior painting crew to indoor drywall patching, door fixes, and smart-home installations.';
      materialImpact = 'Deck wood moisture must drop below 15% before applying semi-transparent stain.';
    } else if (code >= 71 && code <= 86) {
      impactLevel = 'high';
      impactText = 'Sierra Snow Advisory — Mt. Rose / Tahoe chain controls likely.';
      laborImpact = 'Allow +35 min transit buffer for Lake Tahoe visits or reschedule non-urgent exterior jobs to Reno/Sparks indoor punch lists.';
      materialImpact = 'Carry snow chains, winter weatherstripping, and insulated hose-bib covers on Tahoe & Carson vans.';
    }

    return { impactLevel, impactText, laborImpact, materialImpact };
  };

  const fetchLiveWeather = async () => {
    setIsLoading(true);
    const newWeatherData: Record<string, ProjectWeatherData> = {};

    try {
      for (const project of projects) {
        const { lat, lon, name } = getCoordinates(project);
        const weatherUrl = `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current=temperature_2m,wind_speed_10m,weather_code&timezone=auto`;
        const weatherRes = await fetch(weatherUrl);
        const weatherJson = await weatherRes.json();

        const current = weatherJson.current;
        const tempF = Math.round((current.temperature_2m * 9 / 5) + 32);
        const windMph = Math.round(current.wind_speed_10m * 0.621371);
        const weatherCode = current.weather_code;

        const dynamicImpact = generateDynamicImpact(tempF, windMph, weatherCode, project.serviceCategory);

        newWeatherData[project.id] = {
          projectId: project.id,
          projectName: project.name,
          location: name,
          temp: tempF,
          windSpeed: windMph,
          weatherCode,
          description: getWeatherDescription(weatherCode),
          impactLevel: dynamicImpact.impactLevel,
          impactText: dynamicImpact.impactText,
          alerts: [],
          laborImpact: dynamicImpact.laborImpact,
          materialImpact: dynamicImpact.materialImpact
        };
      }
      setWeatherData(newWeatherData);
      setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    } catch {
      loadSimulatedData('live');
    } finally {
      setIsLoading(false);
    }
  };

  const loadSimulatedData = (mode: SimulationMode) => {
    setIsLoading(true);
    const simulated: Record<string, ProjectWeatherData> = {};

    projects.forEach((project) => {
      const { name } = getCoordinates(project);
      const isTahoe = name.includes('Tahoe');
      let temp = isTahoe ? 44 : 56;
      let windSpeed = 9;
      let weatherCode = 1;
      let alerts: ProjectWeatherData['alerts'] = [];

      if (mode === 'tahoe-freeze') {
        temp = isTahoe ? 26 : 36;
        windSpeed = isTahoe ? 24 : 14;
        weatherCode = isTahoe ? 75 : 3;
        if (isTahoe) {
          alerts = [{
            event: 'Sierra Winter Weather Advisory',
            severity: 'High',
            headline: 'Sub-freezing overnight lows and snow showers across Incline Village & Lake Tahoe Basin',
            description: 'Exterior stain and latex trim paint cannot cure safely below 35°F. Chain controls possible on SR-431 Mt. Rose Hwy.'
          }];
        }
      } else if (mode === 'zephyr-wind') {
        temp = isTahoe ? 52 : 64;
        windSpeed = 34;
        weatherCode = 2;
        alerts = [{
          event: 'Washoe Valley Wind Advisory',
          severity: 'Moderate',
          headline: 'Afternoon gusts 30–40 mph across Reno, Sparks & Carson City foothills',
          description: 'Restrict tall extension ladder work for second-story gutter cleanings, roofline cameras, and exterior trim touch-ups.'
        }];
      } else if (mode === 'summer-heat') {
        temp = isTahoe ? 84 : 99;
        windSpeed = 7;
        weatherCode = 0;
      }

      const dynamicImpact = generateDynamicImpact(temp, windSpeed, weatherCode, project.serviceCategory);
      simulated[project.id] = {
        projectId: project.id,
        projectName: project.name,
        location: name,
        temp,
        windSpeed,
        weatherCode,
        description: getWeatherDescription(weatherCode),
        impactLevel: dynamicImpact.impactLevel,
        impactText: dynamicImpact.impactText,
        alerts,
        laborImpact: dynamicImpact.laborImpact,
        materialImpact: dynamicImpact.materialImpact
      };
    });

    setWeatherData(simulated);
    setLastUpdated(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
    setIsLoading(false);
  };

  useEffect(() => {
    if (projects.length > 0 && !selectedProjectId) {
      setSelectedProjectId(projects[0].id);
    }
    if (simulationMode === 'live') {
      fetchLiveWeather();
    } else {
      loadSimulatedData(simulationMode);
    }
  }, [projects.length, simulationMode]);

  const activeWeather = weatherData[selectedProjectId] || Object.values(weatherData)[0];

  return (
    <section className="bg-zinc-900 border border-zinc-800 rounded-3xl p-6 lg:p-8">
      <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 mb-6">
        <div>
          <h3 className="text-lg font-bold text-zinc-100 flex items-center gap-2">
            <Cloud size={20} className="text-sky-400" />
            Northern Nevada Weather & Exterior Paint Radar
          </h3>
          <p className="text-xs text-zinc-400 mt-1">
            Live Reno–Sparks, Carson City & Lake Tahoe conditions for exterior painting, ladders, and winterization dispatch
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="bg-zinc-950 p-1 rounded-xl border border-zinc-800 flex items-center gap-1">
            {([
              { id: 'live', label: 'Live' },
              { id: 'tahoe-freeze', label: 'Tahoe Freeze' },
              { id: 'zephyr-wind', label: 'Zephyr Wind' },
              { id: 'summer-heat', label: 'High Heat' }
            ] as const).map(mode => (
              <button
                key={mode.id}
                onClick={() => setSimulationMode(mode.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors whitespace-nowrap ${
                  simulationMode === mode.id
                    ? 'bg-emerald-600 text-white'
                    : 'text-zinc-400 hover:text-zinc-100'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>

          <button
            onClick={() => simulationMode === 'live' ? fetchLiveWeather() : loadSimulatedData(simulationMode)}
            className="p-2 rounded-xl bg-zinc-950 border border-zinc-800 text-zinc-400 hover:text-zinc-100 transition-colors"
            title="Refresh conditions"
          >
            {isLoading ? <Loader2 size={15} className="animate-spin" /> : <RefreshCw size={15} />}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Service Sites List */}
        <div className="lg:col-span-5 space-y-2.5">
          {projects.map((p) => {
            const w = weatherData[p.id];
            const isSelected = (selectedProjectId || projects[0]?.id) === p.id;
            return (
              <button
                key={p.id}
                onClick={() => setSelectedProjectId(p.id)}
                className={`w-full p-3.5 rounded-xl border text-left transition-colors flex items-center justify-between gap-3 ${
                  isSelected
                    ? 'bg-emerald-500/10 border-emerald-500/40'
                    : 'bg-zinc-950 border-zinc-800 hover:border-zinc-700'
                }`}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-1.5 text-[11px] text-zinc-400">
                    <MapPin size={11} className="text-emerald-400 shrink-0" />
                    <span>{w?.location || p.locationName || 'Sparks, NV'}</span>
                    <span aria-hidden="true">·</span>
                    <span className="truncate">{p.serviceCategory || 'Home Repair'}</span>
                  </div>
                  <p className="text-xs font-bold text-zinc-100 truncate mt-1">{p.name}</p>
                </div>

                {w ? (
                  <div className="flex items-center gap-3 shrink-0">
                    {getWeatherIcon(w.weatherCode, 18)}
                    <div className="text-right font-mono tabular-nums">
                      <p className="text-sm font-bold text-zinc-100">{w.temp}°F</p>
                      <p className={`text-[11px] font-sans font-semibold capitalize ${
                        w.impactLevel === 'high' ? 'text-red-400' :
                        w.impactLevel === 'medium' ? 'text-amber-400' : 'text-emerald-400'
                      }`}>
                        {w.impactLevel} impact
                      </p>
                    </div>
                  </div>
                ) : (
                  <span className="text-xs text-zinc-500">Loading...</span>
                )}
              </button>
            );
          })}
        </div>

        {/* Selected Site Weather Guidance */}
        <div className="lg:col-span-7 bg-zinc-950 border border-zinc-800 rounded-2xl p-6 flex flex-col justify-between">
          {activeWeather ? (
            <div className="space-y-5">
              <div className="flex flex-wrap justify-between items-start gap-4 pb-4 border-b border-zinc-800">
                <div>
                  <p className="text-xs text-zinc-400">
                    {activeWeather.location} · Updated {lastUpdated || 'Just now'}
                  </p>
                  <h4 className="text-base font-bold text-zinc-100 mt-1">{activeWeather.projectName}</h4>
                </div>
                <div className="flex items-center gap-4 font-mono tabular-nums">
                  <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-100">
                    <Thermometer size={15} className="text-amber-400" />
                    {activeWeather.temp}°F
                  </div>
                  <div className="flex items-center gap-1.5 text-sm font-bold text-zinc-300">
                    <Wind size={15} className="text-sky-400" />
                    {activeWeather.windSpeed} mph
                  </div>
                  <div className="flex items-center gap-1.5 text-xs text-zinc-400 font-sans">
                    {getWeatherIcon(activeWeather.weatherCode, 16)}
                    {activeWeather.description}
                  </div>
                </div>
              </div>

              {activeWeather.alerts.length > 0 && (
                <div className="p-4 rounded-xl bg-red-500/10 border border-red-500/30 space-y-1">
                  <p className="text-xs font-bold text-red-400 flex items-center gap-1.5">
                    <AlertTriangle size={14} /> {activeWeather.alerts[0].event}
                  </p>
                  <p className="text-xs text-zinc-200 font-medium">{activeWeather.alerts[0].headline}</p>
                  <p className="text-xs text-zinc-400">{activeWeather.alerts[0].description}</p>
                </div>
              )}

              <div className="space-y-4">
                <div className="flex items-start gap-2.5">
                  {activeWeather.impactLevel === 'low' ? (
                    <CheckCircle2 size={16} className="text-emerald-400 mt-0.5 shrink-0" />
                  ) : (
                    <AlertTriangle size={16} className={activeWeather.impactLevel === 'high' ? 'text-red-400 mt-0.5 shrink-0' : 'text-amber-400 mt-0.5 shrink-0'} />
                  )}
                  <p className="text-sm font-semibold text-zinc-100">{activeWeather.impactText}</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                  <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1.5">
                    <p className="text-xs font-semibold text-emerald-400">Technician Dispatch Guidance</p>
                    <p className="text-xs text-zinc-300 leading-relaxed">{activeWeather.laborImpact}</p>
                  </div>
                  <div className="p-4 bg-zinc-900/70 border border-zinc-800 rounded-xl space-y-1.5">
                    <p className="text-xs font-semibold text-amber-400">Paint, Stain & Material Care</p>
                    <p className="text-xs text-zinc-300 leading-relaxed">{activeWeather.materialImpact}</p>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-12 text-center text-xs text-zinc-500">
              Select a homeowner service site to view Northern Nevada weather dispatch conditions.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
