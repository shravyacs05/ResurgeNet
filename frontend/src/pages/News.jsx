import React, { useState, useEffect } from 'react';

const News = ({ user }) => {
  const [news, setNews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');

  const API_BASE_URL = 'http://localhost:5002/api';

  const categories = [
    { id: 'all', name: 'All Disasters', icon: '🌪️' },
    { id: 'flood', name: 'Floods', icon: '🌊' },
    { id: 'earthquake', name: 'Earthquakes', icon: '🌍' },
    { id: 'fire', name: 'Fires', icon: '🔥' },
    { id: 'cyclone', name: 'Cyclones', icon: '🌀' },
    { id: 'landslide', name: 'Landslides', icon: '⛰️' }
  ];

  // Static premade disaster news data with properly related images
  const staticNewsData = [
    {
      title: "NDRF Teams Rescue 200+ People from Assam Floods",
      description: "National Disaster Response Force teams have successfully rescued over 200 people from flood-affected areas in Assam as heavy monsoon continues to wreak havoc in the region.",
      url: "https://ndma.gov.in/en/flood-updates.html",
      imageUrl: "https://images.unsplash.com/photo-1620641786661-7db83b8d40aa?w=800&q=80", // Rescue boats in flood water
      publishedAt: new Date().toISOString(),
      source: "Disaster Management Authority",
      author: "Emergency Response Team",
      category: "flood"
    },
    {
      title: "6.2 Magnitude Earthquake Strikes Himalayan Region",
      description: "A powerful earthquake measuring 6.2 on Richter scale hit the Himalayan region, triggering landslides and damaging infrastructure. Rescue operations are underway.",
      url: "https://www.usgs.gov/news/featured-story/earthquake-preparedness-what-you-need-know",
      imageUrl: "https://images.unsplash.com/photo-1581938371168-ceede7badb99?w=800&q=80", // Damaged building after earthquake
      publishedAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      source: "Seismic Monitoring Center",
      author: "Geological Survey Team",
      category: "earthquake"
    },
    {
      title: "Wildfire Rages Through Forest Reserve, Evacuations Underway",
      description: "Massive wildfire spreads through national forest reserve, forcing evacuation of nearby villages. Firefighters battling flames from air and ground with limited success.",
      url: "https://www.ready.gov/wildfires",
      imageUrl: "https://images.unsplash.com/photo-1569941554646-37d578f493ed?w=800&q=80", // Forest fire with firefighters
      publishedAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
      source: "Forest Fire Department",
      author: "Fire Safety Unit",
      category: "fire"
    },
    {
      title: "Cyclone Alert: Coastal Areas on High Alert",
      description: "Meteorological department issues cyclone warning for coastal regions. Emergency shelters prepared and fishing activities suspended until further notice.",
      url: "https://www.weather.gov/safety/hurricane",
      imageUrl: "https://images.unsplash.com/photo-1569941554646-37d578f493ed?w=800&q=80", // Stormy sea with waves
      publishedAt: new Date(Date.now() - 6 * 60 * 60 * 1000).toISOString(),
      source: "Meteorological Department",
      author: "Weather Alert Team",
      category: "cyclone"
    },
    {
      title: "Landslide Blocks Major Highway, Rescue Operations Ongoing",
      description: "Heavy rainfall triggers massive landslide blocking crucial mountain highway. Rescue teams working to clear debris and assist stranded travelers in remote area.",
      url: "https://www.fema.gov/emergency-managers/risk-management/landslides",
      imageUrl: "https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80", // Landslide on mountain road
      publishedAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
      source: "Disaster Response Unit",
      author: "Mountain Rescue Team",
      category: "landslide"
    },
    {
      title: "Emergency Preparedness Drill Conducted in Metro Cities",
      description: "Large-scale disaster preparedness drills conducted across major cities to test emergency response systems and evacuation procedures for various disaster scenarios.",
      url: "https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html",
      imageUrl: "https://images.unsplash.com/photo-1583324113626-70b8daec4ac0?w=800&q=80", // Emergency drill with people
      publishedAt: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
      source: "National Disaster Authority",
      author: "Safety Coordination Committee",
      category: "all"
    },
    {
      title: "Flood Warning Issued for Multiple States as Rivers Overflow",
      description: "Central Water Commission issues flood warning for several states as major rivers cross danger marks. Relief camps being set up in vulnerable areas.",
      url: "https://ffs.india-water.gov.in/",
      imageUrl: "https://images.unsplash.com/photo-1570804439979-8018165ac7c1?w=800&q=80", // Overflowing river
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Central Water Commission",
      author: "Hydrology Department",
      category: "flood"
    },
    {
      title: "Earthquake Aftershocks Continue in Northeast Region",
      description: "Series of aftershocks reported in northeast region following yesterday's major earthquake. Structural engineers assessing building damages.",
      url: "https://www.usgs.gov/programs/earthquake-hazards",
      imageUrl: "https://images.unsplash.com/photo-1454789476665-7cd44edc2525?w=800&q=80", // Cracked ground/road
      publishedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Seismic Research Institute",
      author: "Geological Assessment Team",
      category: "earthquake"
    },
    {
      title: "Heatwave Sparks Multiple Forest Fires Across Western Ghats",
      description: "Intense heatwave conditions have sparked multiple forest fires across Western Ghats. Air force helicopters deployed for aerial firefighting operations.",
      url: "https://www.nifc.gov/fire-information",
      imageUrl: "https://images.unsplash.com/photo-1574263867128-a3d5c1b1deae?w=800&q=80", // Aerial view of forest fire
      publishedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Forest Conservation Department",
      author: "Wildfire Response Unit",
      category: "fire"
    },
    {
      title: "Tropical Storm Intensifies Into Cyclone, Coastal Evacuations Begin",
      description: "Tropical storm rapidly intensifies into severe cyclone, prompting mass evacuations in coastal districts. Navy and Coast Guard on standby for rescue operations.",
      url: "https://www.weather.gov/safety/hurricane",
      imageUrl: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80", // Satellite view of cyclone
      publishedAt: new Date(Date.now() - 5 * 60 * 60 * 1000).toISOString(),
      source: "Cyclone Warning Center",
      author: "Marine Safety Division",
      category: "cyclone"
    },
    {
      title: "Mudslide Destroys Several Homes in Hill Station Area",
      description: "Torrential rains trigger destructive mudslide in popular hill station, destroying multiple homes and blocking access roads. Search and rescue teams deployed.",
      url: "https://www.fema.gov/emergency-managers/risk-management/landslides",
      imageUrl: "https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80", // Mudslide damage to houses
      publishedAt: new Date(Date.now() - 10 * 60 * 60 * 1000).toISOString(),
      source: "Hill Area Development Authority",
      author: "Mountain Safety Team",
      category: "landslide"
    },
    {
      title: "Urban Flooding Paralyzes City Life, Emergency Services Overwhelmed",
      description: "Unprecedented urban flooding brings city life to standstill. Emergency services overwhelmed as they respond to thousands of distress calls from affected residents.",
      url: "https://ndma.gov.in/en/flood-updates.html",
      imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80", // Flooded city streets
      publishedAt: new Date(Date.now() - 18 * 60 * 60 * 1000).toISOString(),
      source: "Urban Disaster Management",
      author: "City Emergency Services",
      category: "flood"
    },
    {
      title: "Volcanic Eruption Forces Island Evacuation",
      description: "Active volcano erupts on remote island, spewing ash and lava. Emergency evacuation of local residents underway with international assistance.",
      url: "https://www.usgs.gov/programs/VHP",
      imageUrl: "https://images.unsplash.com/photo-1619468129361-577d5e0e6eaf?w=800&q=80", // Volcanic eruption
      publishedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Volcano Monitoring Center",
      author: "Geological Hazard Team",
      category: "all"
    },
    {
      title: "Drought Emergency Declared in Southern States",
      description: "Government declares drought emergency in three southern states as water reservoirs hit critical levels. Emergency water supply measures implemented.",
      url: "https://droughtmonitor.unl.edu/",
      imageUrl: "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80", // Cracked dry earth
      publishedAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
      source: "Water Resources Department",
      author: "Climate Response Unit",
      category: "all"
    }
  ];

  // Disaster-related keywords to filter API news
  const disasterKeywords = [
    'flood', 'earthquake', 'fire', 'cyclone', 'hurricane', 'typhoon', 'landslide',
    'disaster', 'emergency', 'rescue', 'evacuation', 'NDRF', 'relief', 'calamity',
    'volcano', 'drought', 'tsunami'
  ];

  const isDisasterRelated = (article) => {
    if (!article.title && !article.description) return false;
    
    const content = `${article.title || ''} ${article.description || ''}`.toLowerCase();
    return disasterKeywords.some(keyword => content.includes(keyword.toLowerCase()));
  };

  const fetchNews = async (category = 'all') => {
    try {
      setLoading(true);
      setError(null);

      // Always start with static data
      let filteredStaticNews = staticNewsData;
      
      // Filter static data by category if not 'all'
      if (category !== 'all') {
        filteredStaticNews = staticNewsData.filter(article => 
          article.category === category || article.category === 'all'
        );
      }

      // Set static data immediately for fast loading
      setNews(filteredStaticNews);

      // Then try to fetch from API for additional news
      let url = `${API_BASE_URL}/news/disaster`;
      if (category !== 'all') {
        url = `${API_BASE_URL}/news/disaster/${category}`;
      }

      console.log('Fetching additional news from:', url);

      const response = await fetch(url);
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      const result = await response.json();
      console.log('API Response:', result);

      let apiNewsData = [];
      
      // Handle different response formats
      if (result.success && result.data && Array.isArray(result.data.news)) {
        apiNewsData = result.data.news;
      } else if (result.success && Array.isArray(result.data)) {
        apiNewsData = result.data;
      } else if (Array.isArray(result)) {
        apiNewsData = result;
      } else if (result.news && Array.isArray(result.news)) {
        apiNewsData = result.news;
      }

      // Filter only disaster-related news from API
      if (apiNewsData && apiNewsData.length > 0) {
        const disasterApiNews = apiNewsData.filter(article => isDisasterRelated(article));
        
        // Process API news
        const processedApiNews = disasterApiNews.map(article => ({
          ...article,
          source: typeof article.source === 'object' 
            ? article.source?.name || article.source?.id || 'News Source'
            : article.source || 'News Source',
          author: article.author || 'Reporter',
          publishedAt: article.publishedAt || new Date().toISOString(),
          imageUrl: article.imageUrl || article.urlToImage || getDefaultImage(article.title),
          category: category,
          url: article.url && article.url !== '#' ? article.url : getDefaultUrl(article.title)
        }));

        // Combine static and API news, remove duplicates based on title
        const combinedNews = [...filteredStaticNews];
        
        processedApiNews.forEach(apiArticle => {
          const isDuplicate = combinedNews.some(staticArticle => 
            staticArticle.title.toLowerCase() === apiArticle.title.toLowerCase()
          );
          if (!isDuplicate) {
            combinedNews.push(apiArticle);
          }
        });

        setNews(combinedNews);
        
        console.log(`Combined ${filteredStaticNews.length} static + ${processedApiNews.length} API articles`);
      }

    } catch (err) {
      console.error('Error fetching API news:', err);
      setError('Unable to fetch additional news. Showing disaster updates.');
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get properly related default images
  const getDefaultImage = (title) => {
    const lowerTitle = title.toLowerCase();
    
    if (lowerTitle.includes('flood') || lowerTitle.includes('rain') || lowerTitle.includes('water')) {
      const floodImages = [
        'https://images.unsplash.com/photo-1620641786661-7db83b8d40aa?w=800&q=80', // Rescue boats
        'https://images.unsplash.com/photo-1570804439979-8018165ac7c1?w=800&q=80', // Overflowing river
        'https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80', // Flooded streets
        'https://images.unsplash.com/photo-1591798452850-56d6d2743428?w=800&q=80'  // Submerged area
      ];
      return floodImages[Math.floor(Math.random() * floodImages.length)];
      
    } else if (lowerTitle.includes('earthquake') || lowerTitle.includes('tremor') || lowerTitle.includes('seismic')) {
      const earthquakeImages = [
        'https://images.unsplash.com/photo-1581938371168-ceede7badb99?w=800&q=80', // Damaged building
        'https://images.unsplash.com/photo-1454789476665-7cd44edc2525?w=800&q=80', // Cracked ground
        'https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80', // Collapsed structure
        'https://images.unsplash.com/photo-1581827118590-2b62561d37b5?w=800&q=80'  // Rubble
      ];
      return earthquakeImages[Math.floor(Math.random() * earthquakeImages.length)];
      
    } else if (lowerTitle.includes('fire') || lowerTitle.includes('wildfire') || lowerTitle.includes('blaze')) {
      const fireImages = [
        'https://images.unsplash.com/photo-1569941554646-37d578f493ed?w=800&q=80', // Forest fire with firefighters
        'https://images.unsplash.com/photo-1574263867128-a3d5c1b1deae?w=800&q=80', // Aerial fire view
        'https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=800&q=80', // Close fire flames
        'https://images.unsplash.com/photo-1558618047-3c8c76ca7d13?w=800&q=80'   // Burning forest
      ];
      return fireImages[Math.floor(Math.random() * fireImages.length)];
      
    } else if (lowerTitle.includes('cyclone') || lowerTitle.includes('storm') || lowerTitle.includes('hurricane')) {
      const cycloneImages = [
        'https://images.unsplash.com/photo-1569941554646-37d578f493ed?w=800&q=80', // Stormy sea
        'https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=800&q=80', // Satellite cyclone
        'https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&q=80', // Dark storm clouds
        'https://images.unsplash.com/photo-1496459224015-cf1ec68ab991?w=800&q=80'  // Hurricane damage
      ];
      return cycloneImages[Math.floor(Math.random() * cycloneImages.length)];
      
    } else if (lowerTitle.includes('landslide') || lowerTitle.includes('mudslide')) {
      const landslideImages = [
        'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80', // Road landslide
        'https://images.unsplash.com/photo-1544551763-46a013bb70d5?w=800&q=80', // House damage
        'https://images.unsplash.com/photo-1574263866949-1a28587c6b7c?w=800&q=80', // Mountain slide
        'https://images.unsplash.com/photo-1598300042247-d088f8ab3a91?w=800&q=80'  // Debris flow
      ];
      return landslideImages[Math.floor(Math.random() * landslideImages.length)];
      
    } else if (lowerTitle.includes('volcano') || lowerTitle.includes('eruption')) {
      return 'https://images.unsplash.com/photo-1619468129361-577d5e0e6eaf?w=800&q=80'; // Volcanic eruption
      
    } else if (lowerTitle.includes('drought') || lowerTitle.includes('dry')) {
      return 'https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80'; // Cracked earth
      
    } else {
      const generalImages = [
        'https://images.unsplash.com/photo-1583324113626-70b8daec4ac0?w=800&q=80', // Emergency drill
        'https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800&q=80', // Rescue team
        'https://images.unsplash.com/photo-1589656384667-54bb0fbbd003?w=800&q=80', // Emergency vehicles
        'https://images.unsplash.com/photo-1515168833906-d2a3b82e3074?w=800&q=80'  // Disaster relief
      ];
      return generalImages[Math.floor(Math.random() * generalImages.length)];
    }
  };

  // Helper function to get default URLs for API articles
  const getDefaultUrl = (title) => {
    const lowerTitle = title.toLowerCase();
    if (lowerTitle.includes('flood')) {
      return 'https://ndma.gov.in/en/flood-updates.html';
    } else if (lowerTitle.includes('earthquake')) {
      return 'https://www.usgs.gov/news/featured-story/earthquake-preparedness-what-you-need-know';
    } else if (lowerTitle.includes('fire')) {
      return 'https://www.ready.gov/wildfires';
    } else if (lowerTitle.includes('cyclone') || lowerTitle.includes('storm')) {
      return 'https://www.weather.gov/safety/hurricane';
    } else if (lowerTitle.includes('landslide')) {
      return 'https://www.fema.gov/emergency-managers/risk-management/landslides';
    } else if (lowerTitle.includes('volcano')) {
      return 'https://www.usgs.gov/programs/VHP';
    } else if (lowerTitle.includes('drought')) {
      return 'https://droughtmonitor.unl.edu/';
    } else {
      return 'https://www.redcross.org/get-help/how-to-prepare-for-emergencies.html';
    }
  };

  useEffect(() => {
    fetchNews(selectedCategory);
  }, [selectedCategory]);

  // Filter news based on search term
  const filteredNews = news.filter(article => {
    if (!searchTerm.trim()) return true;
    
    const searchLower = searchTerm.toLowerCase();
    const titleMatch = article.title?.toLowerCase().includes(searchLower);
    const descMatch = article.description?.toLowerCase().includes(searchLower);
    const sourceMatch = article.source?.toLowerCase().includes(searchLower);
    
    return titleMatch || descMatch || sourceMatch;
  });

  const openArticle = (url) => {
    if (url && url !== '#') {
      window.open(url, '_blank', 'noopener,noreferrer');
    }
  };

  const handleImageError = (e, articleTitle) => {
    e.target.onerror = null;
    e.target.src = getDefaultImage(articleTitle);
  };

  const handleRetry = () => {
    fetchNews(selectedCategory);
  };

  return (
    <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
      <div className="px-4 py-6 sm:px-0">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Disaster & Emergency News
          </h1>
          <p className="text-gray-400">
            Real-time updates on natural disasters, emergencies, and rescue operations
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search disaster news..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <div className="absolute right-3 top-3 text-gray-400">
              🔍
            </div>
          </div>
          {searchTerm && (
            <div className="mt-2 text-sm text-gray-400">
              Found {filteredNews.length} article{filteredNews.length !== 1 ? 's' : ''}
              <button 
                onClick={() => setSearchTerm('')}
                className="ml-2 text-blue-400 hover:text-blue-300"
              >
                Clear
              </button>
            </div>
          )}
        </div>

        {/* Category Filters */}
        <div className="mb-8">
          <h3 className="text-lg font-medium text-white mb-4">Disaster Type</h3>
          <div className="flex flex-wrap gap-3">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => {
                  setSelectedCategory(category.id);
                  setSearchTerm('');
                }}
                className={`flex items-center px-4 py-2 rounded-full transition-all ${
                  selectedCategory === category.id
                    ? 'bg-blue-600 text-white shadow-lg'
                    : 'bg-gray-800 text-gray-300 hover:bg-gray-700'
                }`}
              >
                <span className="mr-2">{category.icon}</span>
                {category.name}
              </button>
            ))}
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-yellow-900 border border-yellow-700 text-yellow-200 px-4 py-3 rounded-md mb-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <span className="mr-2">⚠️</span>
                <span>{error}</span>
              </div>
              <button
                onClick={handleRetry}
                className="bg-yellow-600 hover:bg-yellow-700 px-3 py-1 rounded text-sm"
                disabled={loading}
              >
                {loading ? 'Retrying...' : 'Retry'}
              </button>
            </div>
          </div>
        )}

        {/* News Grid */}
        {filteredNews.length === 0 ? (
          <div className="bg-gray-800 rounded-lg p-8 text-center">
            <div className="text-6xl mb-4">🔍</div>
            <h3 className="text-xl font-medium text-white mb-2">No news found</h3>
            <p className="text-gray-400 mb-4">
              {searchTerm 
                ? `No articles match "${searchTerm}"` 
                : 'No news available for this category'}
            </p>
            <button
              onClick={handleRetry}
              className="bg-blue-600 hover:bg-blue-700 px-4 py-2 rounded-lg text-white text-sm"
            >
              Refresh News
            </button>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredNews.map((article, index) => (
                <div
                  key={`${article.source}-${index}`}
                  className="bg-gray-800 rounded-lg overflow-hidden border border-gray-700 hover:border-gray-600 transition-all duration-300 hover:shadow-xl cursor-pointer group"
                  onClick={() => openArticle(article.url)}
                >
                  <div className="h-48 bg-gray-700 overflow-hidden">
                    <img
                      src={article.imageUrl}
                      alt={article.title}
                      onError={(e) => handleImageError(e, article.title)}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      loading="lazy"
                    />
                  </div>

                  <div className="p-6">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm text-blue-400 font-medium">
                        {article.source}
                      </span>
                      <span className="text-xs text-gray-400">
                        {new Date(article.publishedAt).toLocaleDateString()}
                      </span>
                    </div>

                    <h3 className="text-lg font-semibold text-white mb-3 line-clamp-2 group-hover:text-blue-400 transition-colors">
                      {article.title}
                    </h3>

                    <p className="text-gray-300 text-sm mb-4 line-clamp-3">
                      {article.description}
                    </p>

                    <div className="flex items-center justify-between">
                      <span className="text-xs text-gray-400">
                        {article.author}
                      </span>
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          openArticle(article.url);
                        }}
                        className="text-blue-400 hover:text-blue-300 text-sm font-medium flex items-center"
                      >
                        Read Full Story
                        <span className="ml-1">→</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <div className="mt-8 text-center">
              <button
                onClick={handleRetry}
                className="bg-blue-600 hover:bg-blue-700 px-6 py-3 rounded-lg text-white font-medium transition-colors flex items-center mx-auto disabled:opacity-50"
                disabled={loading}
              >
                <span className="mr-2">{loading ? '⏳' : '🔄'}</span>
                {loading ? 'Refreshing...' : 'Load Latest News'}
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default News;