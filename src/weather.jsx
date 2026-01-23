import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Search, Sun, Cloud, CloudRain, 
  CloudLightning, Snowflake, Navigation, Heart, Sunrise, Sunset 
} from 'lucide-react';

const locationData = {
  "United States": ["New York", "Los Angeles", "Chicago", "Miami"],
  "United Kingdom": ["London", "Manchester", "Birmingham", "Edinburgh"],
  "Germany": ["Berlin", "Munich", "Hamburg", "Frankfurt"],
  "Japan": ["Tokyo", "Osaka", "Kyoto", "Nagoya"],
  "India": ["Mumbai", "Delhi", "Bangalore", "Chennai"]
};

const YouTubeLoader = () => (
  <div style={styles.loaderWrapper}>
    <motion.div
      style={styles.ytSpinner}
      animate={{ rotate: 360 }}
      transition={{ repeat: Infinity, duration: 1, ease: "linear" }}
    />
  </div>
);

const WeatherApp = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [weather, setWeather] = useState(null);
  const [loading, setLoading] = useState(false);
  const [unit, setUnit] = useState('C');
  const [favorites, setFavorites] = useState([]);
  const [selectedCity, setSelectedCity] = useState({ name: 'Berlin', country: 'Germany', lat: 52.52, lon: 13.41 });
  const [selCountry, setSelCountry] = useState('');
  const [selCity, setSelCity] = useState('');

  const getActivityTip = () => {
    if (!weather) return "";
    const { temperature, weathercode } = weather.current_weather;
    if (weathercode >= 51) return "Rainy vibes: Perfect for indoor productivity.";
    if (temperature > 28) return "Heat alert: Stay hydrated and find some shade!";
    if (temperature < 10) return "Chilly out there: Bundle up before heading out.";
    if (weathercode === 0) return "It's sunny today! A great time for outdoor fun.";
    return "Weather is clear: Perfect for a light walk or run!";
  };

  const getWeatherIcon = (code, size = 48) => {
    if (code === 0) return <Sun size={size} color="#fcd34d" />;
    if (code >= 1 && code <= 3) return <Cloud size={size} color="#94a3b8" />;
    if (code >= 51 && code <= 67) return <CloudRain size={size} color="#38bdf8" />;
    if (code >= 71 && code <= 77) return <Snowflake size={size} color="#f8fafc" />;
    if (code >= 95) return <CloudLightning size={size} color="#facc15" />;
    return <Cloud size={size} />;
  };

  const convertTemp = (celsius) => unit === 'C' ? Math.round(celsius) : Math.round((celsius * 9/5) + 32);

  const fetchWeather = async (lat, lon) => {
    setLoading(true);
    try {
      const res = await fetch(`https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}&current_weather=true&hourly=temperature_2m,relative_humidity_2m,apparent_temperature&daily=sunrise,sunset&timezone=auto`);
      const data = await res.json();
      setTimeout(() => { setWeather(data); setLoading(false); }, 800);
    } catch (err) { setLoading(false); }
  };

  useEffect(() => { fetchWeather(selectedCity.lat, selectedCity.lon); }, [selectedCity]);

  useEffect(() => {
    if (query.length < 2) { setResults([]); return; }
    const delayDebounceFn = setTimeout(async () => {
      const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${query}&count=5`);
      const data = await res.json();
      setResults(data.results || []);
    }, 300);
    return () => clearTimeout(delayDebounceFn);
  }, [query]);

  const handleDropdownSelect = async (cityName) => {
    setLoading(true);
    const res = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${cityName}&count=1`);
    const data = await res.json();
    if (data.results) {
      const city = data.results[0];
      setSelectedCity({ name: city.name, country: city.country, lat: city.latitude, lon: city.longitude });
      setSelCountry(''); setSelCity('');
    }
  };

  const handleGeoLocation = () => {
    setLoading(true);
    navigator.geolocation.getCurrentPosition(async (pos) => {
      setSelectedCity({ name: "My Location", country: "", lat: pos.coords.latitude, lon: pos.coords.longitude });
    }, () => setLoading(false));
  };

  return (
    <div style={styles.container}>
      <motion.div 
        animate={{ scale: [1, 1.1, 1], backgroundColor: weather?.current_weather.temperature > 25 ? '#f59e0b' : '#3b82f6' }}
        transition={{ duration: 15, repeat: Infinity }}
        style={styles.blob} 
      />

      <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} style={styles.glassCard}>
        <div style={styles.favBar}>
          {favorites.map(fav => (
            <div key={fav.name} style={styles.favChip} onClick={() => setSelectedCity(fav)}>{fav.name.substring(0,3)}</div>
          ))}
          <Heart 
            size={18} 
            onClick={() => favorites.find(f => f.name === selectedCity.name) ? setFavorites(favorites.filter(f => f.name !== selectedCity.name)) : setFavorites([...favorites, selectedCity])}
            fill={favorites.find(f => f.name === selectedCity.name) ? "#ef4444" : "none"} 
            style={{ cursor: 'pointer', marginLeft: 'auto' }}
          />
        </div>

        <p style={styles.label}>Option A: Select Place</p>
        <div style={styles.row}>
          <select style={styles.select} value={selCountry} onChange={(e) => setSelCountry(e.target.value)}>
            <option value="" style={styles.blackText}>Country</option>
            {Object.keys(locationData).map(c => <option key={c} value={c} style={styles.blackText}>{c}</option>)}
          </select>
          <select 
            style={{...styles.select, opacity: selCountry ? 1 : 0.5}} 
            disabled={!selCountry}
            value={selCity}
            onChange={(e) => handleDropdownSelect(e.target.value)}
          >
            <option value="" style={styles.blackText}>City</option>
            {selCountry && locationData[selCountry].map(city => <option key={city} value={city} style={styles.blackText}>{city}</option>)}
          </select>
        </div>

        <div style={styles.divider}><span>OR</span></div>

        <p style={styles.label}>Option B: Search Global</p>
        <div style={styles.searchRow}>
          <div style={styles.searchBox}>
            <Search size={16} opacity={0.4}/>
            <input style={styles.input} placeholder="Type a city..." value={query} onChange={(e) => setQuery(e.target.value)} />
            <Navigation size={16} style={{ cursor: 'pointer' }} onClick={handleGeoLocation} />
          </div>
          <div style={styles.toggle} onClick={() => setUnit(unit === 'C' ? 'F' : 'C')}>{unit}</div>
        </div>

        <AnimatePresence>
          {results.length > 0 && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} style={styles.dropdown}>
              {results.map(c => (
                <div key={c.id} style={styles.dropItem} onClick={() => { setSelectedCity({name: c.name, country: c.country, lat: c.latitude, lon: c.longitude}); setResults([]); setQuery(''); }}>
                  {c.name}, <span style={{fontSize: '11px', opacity: 0.5}}>{c.country}</span>
                </div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        <div style={styles.mainDisplay}>
          <AnimatePresence mode="wait">
            {loading ? (
              <motion.div key="loader" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                <YouTubeLoader />
                <p style={{fontSize: '10px', opacity: 0.5, marginTop: '15px', letterSpacing: '1px'}}>SYNCHRONIZING...</p>
              </motion.div>
            ) : weather && (
              <motion.div key={selectedCity.name} initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                <div style={styles.weatherHeader}>
                  {getWeatherIcon(weather.current_weather.weathercode)}
                  <h2 style={{margin: '10px 0 0 0'}}>{selectedCity.name}</h2>
                  <p style={styles.subText}>Feels like {convertTemp(weather.hourly.apparent_temperature[0])}°</p>
                </div>
                <h1 style={styles.bigTemp}>{convertTemp(weather.current_weather.temperature)}°</h1>
                
                <div style={styles.sparklineContainer}>
                  <svg viewBox="0 0 200 40" style={styles.svg}>
                    <polyline fill="none" stroke="#38bdf8" strokeWidth="2" points={weather.hourly.temperature_2m.slice(0, 24).map((t, i) => `${i * 8.6},${40 - (t - Math.min(...weather.hourly.temperature_2m.slice(0, 24)) + 5)}`).join(' ')} />
                  </svg>
                </div>

                <div style={styles.grid}>
                  <div style={styles.gridItem}><Sunrise size={12}/> {weather.daily.sunrise[0].split('T')[1]}</div>
                  <div style={styles.gridItem}><Sunset size={12}/> {weather.daily.sunset[0].split('T')[1]}</div>
                </div>

                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={styles.tipBox}>
                  {getActivityTip()}
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  );
};

const styles = {
  container: { height: '100vh', width: '100%', background: '#020617', display: 'flex', justifyContent: 'center', alignItems: 'center', overflow: 'hidden', position: 'relative', color: '#fff', fontFamily: 'Inter, sans-serif' },
  blob: { position: 'absolute', width: '600px', height: '600px', filter: 'blur(100px)', borderRadius: '50%', zIndex: 0, opacity: 0.3 },
  glassCard: { width: '400px', padding: '35px', background: 'rgba(255,255,255,0.03)', backdropFilter: 'blur(30px)', borderRadius: '32px', zIndex: 1, border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 25px 50px rgba(0,0,0,0.5)' },
  favBar: { display: 'flex', gap: '8px', marginBottom: '20px', alignItems: 'center' },
  favChip: { padding: '4px 10px', background: 'rgba(255,255,255,0.1)', borderRadius: '20px', fontSize: '10px', cursor: 'pointer' },
  label: { fontSize: '9px', fontWeight: '800', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', opacity: 0.4 },
  row: { display: 'flex', gap: '10px', marginBottom: '10px' },
  select: { flex: 1, background: 'rgba(255,255,255,0.08)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', padding: '10px', borderRadius: '12px', outline: 'none' },
  blackText: { color: '#000' },
  divider: { textAlign: 'center', margin: '15px 0', fontSize: '9px', opacity: 0.2 },
  searchRow: { display: 'flex', gap: '10px' },
  searchBox: { flex: 1, display: 'flex', alignItems: 'center', gap: '10px', background: 'rgba(255,255,255,0.05)', padding: '10px 15px', borderRadius: '12px' },
  input: { background: 'none', border: 'none', color: '#fff', outline: 'none', width: '100%', fontSize: '13px' },
  toggle: { width: '40px', height: '40px', background: 'rgba(255,255,255,0.1)', borderRadius: '12px', display: 'flex', justifyContent: 'center', alignItems: 'center', cursor: 'pointer', fontSize: '12px' },
  dropdown: { position: 'absolute', background: '#fff', color: '#000', width: '330px', borderRadius: '12px', zIndex: 10, marginTop: '5px', overflow: 'hidden' },
  dropItem: { padding: '12px', borderBottom: '1px solid #eee', cursor: 'pointer', fontSize: '13px' },
  mainDisplay: { textAlign: 'center', marginTop: '20px', minHeight: '380px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center' },
  bigTemp: { fontSize: '5.5rem', fontWeight: '200', margin: '5px 0' },
  subText: { fontSize: '12px', opacity: 0.5 },
  sparklineContainer: { margin: '20px 0', textAlign: 'left', width: '100%' },
  svg: { width: '100%', height: '40px' },
  grid: { display: 'flex', gap: '10px', justifyContent: 'center', marginTop: '5px' },
  gridItem: { background: 'rgba(255,255,255,0.05)', padding: '8px 15px', borderRadius: '20px', fontSize: '11px', display: 'flex', alignItems: 'center', gap: '6px' },
  tipBox: { marginTop: '25px', padding: '15px', background: 'rgba(56, 189, 248, 0.1)', borderRadius: '15px', fontSize: '11px', color: '#7dd3fc', lineHeight: '1.5' },
  loaderWrapper: { display: 'flex', justifyContent: 'center', alignItems: 'center' },
  ytSpinner: { width: '40px', height: '40px', borderRadius: '50%', border: '3px solid rgba(255, 255, 255, 0.1)', borderTop: '3px solid #38bdf8' }
};

export default WeatherApp;