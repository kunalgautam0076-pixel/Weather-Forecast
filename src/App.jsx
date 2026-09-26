import { useState, useEffect } from 'react';
import { 
  Search, MapPin, Wind, Droplets, ThermometerSun, 
  Sun, CloudRain, Cloud, CloudLightning, CloudSun, Moon, Navigation
} from 'lucide-react';
import './index.css';

const API_URL = "https://api.open-meteo.com/v1/forecast";
const GEO_URL = "https://geocoding-api.open-meteo.com/v1/search";
const REVERSE_GEO_URL = "https://nominatim.openstreetmap.org/reverse";

// Comprehensive Unsplash Photo Mapping for ALL weather codes - VERIFIED URLs
const getBackgroundImage = (code, isDay) => {
  const params = '?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80';
  const isNight = Number(isDay) === 0;

  // 0: Clear
  if (code === 0) return isNight ? `https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee${params}` : `https://images.unsplash.com/photo-1601297183305-6df142704ea2${params}`;

  // 1, 2, 3, 45, 48: Clouds / Fog
  if (code > 0 && code < 50) return isNight ? `https://images.unsplash.com/photo-1509773896068-7fd415d91e2e${params}` : `https://images.unsplash.com/photo-1501691223387-dd0500403074${params}`;

  // 51-67, 80-82: Rain / Drizzle
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return isNight ? `https://images.unsplash.com/photo-1518288774672-b94e808873ff${params}` : `https://images.unsplash.com/photo-1534274988757-a28bf1a57c17${params}`;

  // 71-77, 85-86: Snow
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return isNight ? `https://images.unsplash.com/photo-1517292987719-0369a794ec0f${params}` : `https://images.unsplash.com/photo-1542601098-8fc114e148e2${params}`;

  // 95-99: Thunderstorm
  if (code >= 95) return isNight ? `https://images.unsplash.com/photo-1500375592092-40eb2168fd21${params}` : `https://images.unsplash.com/photo-1472145346473-77440b8a24ed${params}`;

  return isNight ? `https://images.unsplash.com/photo-1419833173245-f59e1b93f9ee${params}` : `https://images.unsplash.com/photo-1601297183305-6df142704ea2${params}`;
};

function App() {
  const [query, setQuery] = useState('');
  const [weather, setWeather] = useState(null);
  const [locationName, setLocationName] = useState('Monterey');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  
  // Interactive states
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [selectedHourIndex, setSelectedHourIndex] = useState(null); // NEW: Hour-by-hour interactivity

  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const fetchWeather = async (lat, lon, name) => {
    setLoading(true);
    setError(null);
    setSelectedDayIndex(0); 
    setSelectedHourIndex(null);
    try {
      // Added hourly=is_day so we know if it's day/night for a specific hour clicked
      const response = await fetch(
        `${API_URL}?latitude=${lat}&longitude=${lon}&current=temperature_2m,relative_humidity_2m,apparent_temperature,is_day,weather_code,wind_speed_10m&hourly=temperature_2m,weather_code,relative_humidity_2m,is_day&daily=weather_code,temperature_2m_max,temperature_2m_min,wind_speed_10m_max&timezone=auto`
      );
      if (!response.ok) throw new Error('Failed to fetch data');
      const data = await response.json();
      setWeather(data);
      if (name) setLocationName(name);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getUserLocation = () => {
    setLoading(true);
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        async (position) => {
          const { latitude, longitude } = position.coords;
          try {
            const res = await fetch(`${REVERSE_GEO_URL}?format=json&lat=${latitude}&lon=${longitude}`);
            const data = await res.json();
            const city = data.address.city || data.address.town || data.address.state || 'Your Location';
            fetchWeather(latitude, longitude, city);
          } catch {
            fetchWeather(latitude, longitude, "Current Location");
          }
        },
        () => fetchWeather(36.6002, -121.8947, 'Monterey')
      );
    } else {
      fetchWeather(36.6002, -121.8947, 'Monterey');
    }
  };

  const searchLocation = async (e) => {
    if (e.key === 'Enter' && query.trim() !== '') {
      setLoading(true);
      try {
        const res = await fetch(`${GEO_URL}?name=${query}&count=1&language=en&format=json`);
        const data = await res.json();
        if (data.results && data.results.length > 0) {
          const { latitude, longitude, name } = data.results[0];
          fetchWeather(latitude, longitude, name);
          setQuery('');
        } else {
          setError('Not found');
          setLoading(false);
        }
      } catch (err) {
        setError('Error');
        setLoading(false);
      }
    }
  };

  useEffect(() => {
    getUserLocation();
  }, []);

  const getWeatherIcon = (code, className, isDay = 1) => {
    if (code === 0) return isDay ? <Sun className={className} /> : <Moon className={className} />;
    if (code > 0 && code < 4) return <CloudSun className={className} />;
    if (code >= 51 && code <= 67) return <CloudRain className={`${className} rain`} />;
    if (code >= 71 && code <= 77) return <CloudRain className={`${className} rain`} />; 
    if (code >= 95) return <CloudLightning className={`${className} rain`} />;
    return <CloudSun className={className} />;
  };

  const getWeatherString = (code) => {
    if (code === 0) return 'Clear';
    if (code === 1 || code === 2) return 'Partly Cloudy';
    if (code === 3) return 'Overcast';
    if (code >= 51 && code <= 67) return 'Light Rain Showers';
    if (code >= 71 && code <= 77) return 'Snow';
    if (code >= 95) return 'Thunderstorms';
    return 'Cloudy';
  };

  const formatHour = (isoString) => {
    const date = new Date(isoString);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase();
  };

  if (loading && !weather) {
    return <div className="loading-screen">Loading UI...</div>;
  }

  // INTERACTIVE DATA LOGIC
  const isToday = selectedDayIndex === 0;
  
  // Dates
  const targetDate = new Date(weather.daily.time[selectedDayIndex]);
  const dateStr = targetDate.toLocaleDateString('en-US', { day: 'numeric', month: 'long', weekday: 'long' });
  const cardDayStr = isToday ? targetDate.toLocaleDateString('en-US', { weekday: 'long' }) : targetDate.toLocaleDateString('en-US', { weekday: 'long', month: 'short', day: 'numeric' });
  
  let temp, code, secondaryTempDesc, secondaryTemp, isDayTheme, wind, humidity, tempMax, cardTimeStr;

  // New Feature: Clicking an hour changes the entire screen dynamically!
  if (selectedHourIndex !== null) {
    temp = Math.round(weather.hourly.temperature_2m[selectedHourIndex]);
    code = weather.hourly.weather_code[selectedHourIndex];
    
    // Instead of repeating the time, show the weather condition at this hour!
    secondaryTempDesc = "Expect";
    secondaryTemp = getWeatherString(code);
    
    isDayTheme = weather.hourly.is_day[selectedHourIndex];
    cardTimeStr = formatHour(weather.hourly.time[selectedHourIndex]); // Update top-right clock to the selected hour!
    
    wind = weather.daily.wind_speed_10m_max[selectedDayIndex];
    humidity = weather.hourly.relative_humidity_2m[selectedHourIndex];
    tempMax = Math.round(weather.daily.temperature_2m_max[selectedDayIndex]);
  } else {
    temp = isToday ? Math.round(weather.current.temperature_2m) : Math.round(weather.daily.temperature_2m_max[selectedDayIndex]);
    code = isToday ? weather.current.weather_code : weather.daily.weather_code[selectedDayIndex];
    secondaryTempDesc = isToday ? "Real feel" : "Min Temp";
    secondaryTemp = isToday ? Math.round(weather.current.apparent_temperature) + "°C" : Math.round(weather.daily.temperature_2m_min[selectedDayIndex]) + "°C";
    isDayTheme = isToday ? weather.current.is_day : 1;
    cardTimeStr = isToday ? currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase() : "Forecast";
    
    const hourIndexForDay = selectedDayIndex * 24 + 12; // 12 PM for future days
    wind = isToday ? weather.current.wind_speed_10m : weather.daily.wind_speed_10m_max[selectedDayIndex];
    humidity = isToday ? weather.current.relative_humidity_2m : weather.hourly.relative_humidity_2m[hourIndexForDay];
    tempMax = Math.round(weather.daily.temperature_2m_max[selectedDayIndex]);
  }

  // Dynamic Background Calculation
  const dynamicImageURL = getBackgroundImage(code, isDayTheme);
  const isNightMode = Number(isDayTheme) === 0;

  return (
    <>
      <div
        className="app-background"
        style={{
          backgroundImage: `url(${dynamicImageURL})`,
          filter: isNightMode ? 'brightness(0.62) saturate(0.8)' : 'none',
          backgroundColor: isNightMode ? '#071a2a' : '#1d6bd1'
        }}
      ></div>
      <div className="app-background-overlay" style={{ background: isNightMode ? 'linear-gradient(to bottom, rgba(2,6,23,0.22), rgba(2,6,23,0.7))' : 'linear-gradient(to bottom, rgba(0,0,0,0.2), rgba(0,0,0,0.5))' }}></div>
      
      <div>
        <div className="top-panel">
          <div className="header-nav">
            <div className="header-time">
              <span>{currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }).toLowerCase()}</span>
            </div>

            <div className="header-location">
              <div className="city-name">{locationName}</div>
              <div className="text-muted text-sm">
                {currentTime.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
              </div>
            </div>

            <button className="header-btn live-tracking-btn" onClick={getUserLocation} aria-label="Live location tracking">
              <Navigation size={18} />
              <span>Live</span>
            </button>
          </div>

          <div className="search-wrapper">
            <Search className="text-muted" size={20} />
            <input 
              type="text" 
              placeholder="Search For City" 
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={searchLocation}
            />
            <MapPin className="text-muted" size={20} />
          </div>
        </div>

        <div className="app-grid">
          
          <div>
            <div
              className="main-card"
              style={{
                backgroundImage: `url(${dynamicImageURL})`,
                filter: isNightMode ? 'brightness(0.72) saturate(0.9)' : 'none',
                backgroundColor: isNightMode ? '#0b1a2d' : '#1d6bd1'
              }}
            >
              <div className="main-card-header">
                <span className="font-semibold">{cardDayStr}</span>
                <span className="text-muted">{cardTimeStr}</span>
              </div>
              <div className="main-card-body">
                <div className="huge-temp">
                  {temp}<span>°C</span>
                </div>
                {getWeatherIcon(code, "weather-icon-huge", isDayTheme)}
              </div>
              <div className="real-feel">
                {secondaryTempDesc} {secondaryTemp}
              </div>

              <div className="mini-cards-grid">
                <div className="mini-card">
                  <Wind className="mini-card-icon" size={24} />
                  <div className="mini-card-title">Wind</div>
                  <div className="mini-card-value">{wind} km/h</div>
                </div>
                <div className="mini-card">
                  <ThermometerSun className="mini-card-icon" size={24} />
                  <div className="mini-card-title">Max Temp</div>
                  <div className="mini-card-value">{tempMax}°C</div>
                </div>
                <div className="mini-card">
                  <Droplets className="mini-card-icon" size={24} />
                  <div className="mini-card-title">Humidity</div>
                  <div className="mini-card-value">{humidity}%</div>
                </div>
              </div>
            </div>
          </div>

          <div>
            <div className="section-title">
              {isToday ? "Hourly Forecast" : `${cardDayStr} Forecast`}
            </div>
            
            <div className="hourly-container">
              {weather.hourly.time.slice(selectedDayIndex * 24, (selectedDayIndex * 24) + 12).map((time, idx) => {
                const globalHourIndex = (selectedDayIndex * 24) + idx;
                // Active if specifically selected, or if nothing is selected and it's "Now" (index 0 on today)
                const isActive = selectedHourIndex === globalHourIndex || (selectedHourIndex === null && idx === 0 && isToday);
                const hourCode = weather.hourly.weather_code[globalHourIndex];
                const hourIsDay = weather.hourly.is_day[globalHourIndex];

                return (
                  <div 
                    key={time} 
                    className={`hourly-item ${isActive ? 'active' : ''}`}
                    onClick={() => setSelectedHourIndex(globalHourIndex)}
                    style={{ cursor: 'pointer' }}
                  >
                    <div className="hourly-time">{idx === 0 && isToday ? 'Now' : formatHour(time)}</div>
                    {getWeatherIcon(hourCode, isActive ? "" : "text-muted", hourIsDay)}
                    <div className="hourly-temp">{Math.round(weather.hourly.temperature_2m[globalHourIndex])}°</div>
                  </div>
                );
              })}
            </div>

            <div className="section-title" style={{ marginTop: '2rem', marginBottom: 0 }}>Upcoming</div>
            
            {/* Tomorrow Card */}
            <div 
              className="tomorrow-card" 
              onClick={() => { setSelectedDayIndex(1); setSelectedHourIndex(null); }}
              style={{ 
                 transform: selectedDayIndex === 1 && selectedHourIndex === null ? 'scale(1.02)' : 'scale(1)',
                 background: selectedDayIndex === 1 && selectedHourIndex === null ? 'rgba(255, 255, 255, 0.25)' : 'rgba(255, 255, 255, 0.15)'
              }}
            >
              <div className="tomorrow-left">
                {getWeatherIcon(weather?.daily.weather_code[1], "", 1)}
                <div>
                  <div className="tomorrow-title">Tomorrow</div>
                  <div className="tomorrow-desc">{getWeatherString(weather?.daily.weather_code[1])}</div>
                </div>
              </div>
              <div className="tomorrow-temps">
                ↑ {Math.round(weather?.daily.temperature_2m_max[1])}° ↓ {Math.round(weather?.daily.temperature_2m_min[1])}°
              </div>
            </div>

            {/* 7-Day Extension */}
            <div className="weekly-container">
              {weather.daily.time.slice(2, 7).map((time, idx) => {
                const actualIndex = idx + 2; 
                const dayName = new Date(time).toLocaleDateString('en-US', { weekday: 'long' });
                const dailyCode = weather.daily.weather_code[actualIndex];
                const max = Math.round(weather.daily.temperature_2m_max[actualIndex]);
                const min = Math.round(weather.daily.temperature_2m_min[actualIndex]);
                
                const isActiveDay = selectedDayIndex === actualIndex && selectedHourIndex === null;

                return (
                  <div 
                    key={time} 
                    className={`weekly-item ${isActiveDay ? 'active-day' : ''}`}
                    onClick={() => { setSelectedDayIndex(actualIndex); setSelectedHourIndex(null); }}
                  >
                    <div className="weekly-day">{dayName}</div>
                    <div className="weekly-icon">{getWeatherIcon(dailyCode, isActiveDay ? "" : "text-muted", 1)}</div>
                    <div className="weekly-temps">
                      <span className="font-medium">{max}°</span>
                      <span className="text-muted ml-2">{min}°</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

        </div>

      </div>
    </>
  );
}

export default App;
