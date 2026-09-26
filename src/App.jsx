import { useState, useEffect } from 'react';
import { 
  Search, MapPin, Wind, Droplets, Sun, 
  CloudRain, Cloud, ThermometerSun, Eye,
  Navigation
} from 'lucide-react';
import './index.css';

// Using open-meteo (no API key required) and geocoding api for location search
const API_URL = "https://api.open-meteo.com/v1/forecast";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";

function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('London');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchWeather = async (lat, lon, name) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch(
        `${API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,precipitation,weather_code,wind_speed_10m,wind_direction_10m&hourly=temperature_2m,weather_code&daily=weather_code,temperature_2m_max,temperature_2m_min,uv_index_max&timezone=auto`
      );
      if (!response.ok) throw new Error('Failed to fetch weather data');
      const data = await response.json();
      setWeather(data);
      setLocationName(name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const searchLocation = async (e) => {
    if (e.key === 'Enter' && query.trim() !== '') {
      setLoading(true);
      try {
        const res = await fetch(`${GEO_URL}?name=${query}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const { latitude, longitude, name, country } = data.results[0];
          fetchWeather(latitude, longitude, `${name}, ${country}`);
          setQuery('');
        } else {
          setError('Location not found');
          setLoading(false);
        }
      } catch (err) {
        setError('Error searching location');
        setLoading(false);
      }
    }
  };

  // Initial load
  useEffect(() => {
    fetchWeather(51.5085, -0.1257, 'London, United Kingdom');
  }, []);

  const getWeatherIcon = (code, isLarge = false) => {
    const props = { className: isLarge ? 'weather-icon-large' : 'text-accent', size: isLarge ? 120 : 32 };
    // Simplified WMO Weather interpretation codes
    if (code === 0) return <Sun {...props} />;
    if (code > 0 && code < 4) return <Cloud {...props} />;
    if (code >= 51 && code <= 67) return <CloudRain {...props} />;
    if (code >= 71 && code <= 77) return <CloudRain {...props} />; // Snow (simplified to rain icon for this demo)
    return <Sun {...props} />;
  };

  if (loading && !weather) {
    return <div className="status-message">Loading amazing weather...</div>;
  }

  return (
    <div className="app-container">
      {/* Left Sidebar - Current Weather */}
      <div className="dashboard-left">
        <div className="search-container">
          <Search className="search-icon" size={20} />
          <input
            type="text"
            className="search-input"
            placeholder="Search for places..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={searchLocation}
          />
        </div>

        {error ? (
          <div className="glass-panel current-weather">
            <p className="text-red-400">{error}</p>
          </div>
        ) : weather && (
          <div className="glass-panel current-weather">
            {getWeatherIcon(weather.current.weather_code, true)}
            <div className="temperature">
              {Math.round(weather.current.temperature_2m)}°
            </div>
            <div className="condition">
              {weather.current.is_day ? 'Day' : 'Night'} Time
            </div>
            <div className="location">
              <MapPin size={18} />
              {locationName}
            </div>
            <div className="mt-6 text-sm text-gray-400">
              Feels like: {Math.round(weather.current.apparent_temperature)}°C
            </div>
          </div>
        )}
      </div>

      {/* Right Content - Highlights & Forecast */}
      {weather && !error && (
        <div className="dashboard-right">
          {/* Today's Highlights */}
          <div className="glass-panel">
            <h2 className="highlights-header">Today's Highlights</h2>
            <div className="highlights-grid">
              
              <div className="highlight-card glass-panel">
                <span className="highlight-title">Wind Status</span>
                <div className="highlight-value">
                  {weather.current.wind_speed_10m} <span className="highlight-unit">km/h</span>
                  <Wind className="text-accent" size={32} />
                </div>
                <div className="mt-2 text-sm text-gray-400 flex items-center gap-2">
                  <Navigation size={14} style={{ transform: `rotate(${weather.current.wind_direction_10m}deg)` }} />
                  {weather.current.wind_direction_10m}°
                </div>
              </div>

              <div className="highlight-card glass-panel">
                <span className="highlight-title">Humidity</span>
                <div className="highlight-value">
                  {weather.current.relative_humidity_2m} <span className="highlight-unit">%</span>
                  <Droplets className="text-accent" size={32} />
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {weather.current.relative_humidity_2m > 60 ? 'High humidity' : 'Normal'}
                </div>
              </div>

              <div className="highlight-card glass-panel">
                <span className="highlight-title">Visibility</span>
                <div className="highlight-value">
                  Good <span className="highlight-unit"></span>
                  <Eye className="text-accent" size={32} />
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  Clear view
                </div>
              </div>

              <div className="highlight-card glass-panel">
                <span className="highlight-title">Max UV Index</span>
                <div className="highlight-value">
                  {weather.daily.uv_index_max[0]} <span className="highlight-unit"></span>
                  <ThermometerSun className="text-accent" size={32} />
                </div>
                <div className="mt-2 text-sm text-gray-400">
                  {weather.daily.uv_index_max[0] > 5 ? 'High UV risk' : 'Low UV risk'}
                </div>
              </div>

            </div>
          </div>

          {/* Forecast */}
          <div className="glass-panel">
            <h2 className="highlights-header">7-Day Forecast</h2>
            <div className="forecast-container">
              {weather.daily.time.map((time, index) => {
                const date = new Date(time);
                const day = index === 0 ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' });
                return (
                  <div key={time} className="forecast-card glass-panel">
                    <span className="forecast-time">{day}</span>
                    {getWeatherIcon(weather.daily.weather_code[index])}
                    <div className="forecast-temp">
                      {Math.round(weather.daily.temperature_2m_max[index])}° 
                      <span className="text-sm text-gray-400 ml-1">
                        {Math.round(weather.daily.temperature_2m_min[index])}°
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>
      )}
    </div>
  );
}

export default App;
