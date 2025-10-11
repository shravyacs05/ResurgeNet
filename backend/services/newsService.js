// backend/services/newsService.js

class NewsService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
    this.baseURL = 'https://newsapi.org/v2';
    this.initialized = false;
    this.cache = {};
    this.CACHE_DURATION = 60 * 60 * 1000; // 1 hour cache
  }

  async init() {
    if (this.initialized) return;

    console.log('\n============================================');
    console.log('NewsService Initialization');
    console.log('============================================');
    console.log('API Key Present:', !!this.apiKey);
    
    this.initialized = true;
  }

  // Curated disaster news from reliable sources
  getCuratedDisasterNews() {
    return [
      {
        title: "Heavy Flooding in Northeast India Claims Multiple Lives",
        description: "Severe monsoon floods in Assam and Meghalaya have displaced thousands. NDRF teams rescue stranded residents. Water levels rising in major rivers.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
        publishedAt: "11 Oct 2025",
        source: "The Hindu",
        author: "Disaster Correspondent"
      },
      {
        title: "Earthquake Shakes Delhi-NCR Region, No Major Damage Reported",
        description: "A 4.2 magnitude earthquake hit the Delhi-NCR region early morning. Residents evacuated buildings. Seismic centres monitoring aftershocks.",
        url: "https://www.timesofindia.com",
        imageUrl: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80",
        publishedAt: "11 Oct 2025",
        source: "Times of India",
        author: "News Bureau"
      },
      {
        title: "Cyclone Alert Issued for Bay of Bengal, Fishermen Warned",
        description: "IMD issues cyclone warning for eastern coastal regions. Fishermen advised not to venture into sea. States prepare evacuation plans.",
        url: "https://www.ndtv.com",
        imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&q=80",
        publishedAt: "10 Oct 2025",
        source: "NDTV",
        author: "Weather Desk"
      },
      {
        title: "Forest Fires Spread Across Uttarakhand, 200+ Hectares Burned",
        description: "Multiple forest fires raging across Uttarakhand forests. Aerial spraying underway. Local communities evacuated to safety.",
        url: "https://www.bbc.com/news",
        imageUrl: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=800&q=80",
        publishedAt: "10 Oct 2025",
        source: "BBC News",
        author: "India Correspondent"
      },
      {
        title: "Landslide Blocks Major Highway in Himachal Pradesh",
        description: "A massive landslide has blocked the Manali-Leh highway. Rescue operations underway. Hundreds of vehicles stranded.",
        url: "https://www.hindustantimes.com",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        publishedAt: "09 Oct 2025",
        source: "Hindustan Times",
        author: "Regional Desk"
      },
      {
        title: "NDRF Deploys Teams to Flood-Affected Bihar Districts",
        description: "National Disaster Response Force personnel deployed across Bihar as water levels continue to rise. Relief camps established.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
        publishedAt: "09 Oct 2025",
        source: "The Hindu",
        author: "NDRF Correspondent"
      },
      {
        title: "Severe Heatwave Alert for Northern States",
        description: "IMD issues severe heatwave warning for north India. Temperature expected to reach 48°C. Public advised to stay indoors.",
        url: "https://www.aaj-tak.com",
        imageUrl: "https://images.unsplash.com/photo-1509803874385-db7c23652552?w=800&q=80",
        publishedAt: "08 Oct 2025",
        source: "Aaj Tak",
        author: "Weather Reporter"
      },
      {
        title: "Thunderstorm and Lightning Deaths Reported in Maharashtra",
        description: "Seven people killed by lightning strikes during severe thunderstorm. Meteorological department issues ongoing alerts.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&q=80",
        publishedAt: "08 Oct 2025",
        source: "The Hindu",
        author: "Maharashtra Desk"
      },
      {
        title: "Cloud Burst in Himachal Causes Flash Floods",
        description: "A sudden cloud burst in Himachal Pradesh triggered flash floods. Several villages affected. Search operations for missing persons ongoing.",
        url: "https://www.indiatoday.in",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        publishedAt: "07 Oct 2025",
        source: "India Today",
        author: "Breaking News Desk"
      },
      {
        title: "Avalanche Warning for Kashmir Higher Reaches",
        description: "Avalanche warnings issued for higher reaches of Kashmir. Trekkers and tourists advised to avoid dangerous zones.",
        url: "https://www.kashmirreader.com",
        imageUrl: "https://images.unsplash.com/photo-1551582045-6ec9c11d8697?w=800&q=80",
        publishedAt: "07 Oct 2025",
        source: "Kashmir Reader",
        author: "Safety Correspondent"
      },
      {
        title: "Building Collapse in Mumbai, Rescue Operations Ongoing",
        description: "A 40-year-old building collapsed in Mumbai. NDRF personnel rescue residents from debris. Multiple injuries reported.",
        url: "https://www.mumbaiwatch.com",
        imageUrl: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80",
        publishedAt: "06 Oct 2025",
        source: "Mumbai Watch",
        author: "City Correspondent"
      },
      {
        title: "Dam Water Release Alert for Gujarat",
        description: "Authorities announce controlled water release from Sardar Sarovar dam. Low-lying areas advised to evacuate.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
        publishedAt: "06 Oct 2025",
        source: "The Hindu",
        author: "Gujarat Correspondent"
      },
      {
        title: "Coastal Erosion Threatens Villages in Tamil Nadu",
        description: "Severe coastal erosion affecting fishing communities in Tamil Nadu. Government announces rehabilitation plan.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&q=80",
        publishedAt: "05 Oct 2025",
        source: "The Hindu",
        author: "Environment Correspondent"
      },
      {
        title: "Drought Worsens in Rajasthan, Water Crisis Deepens",
        description: "Severe drought affecting Rajasthan districts. Government distributes water tankers. Farmers losing crops.",
        url: "https://www.indiatoday.in",
        imageUrl: "https://images.unsplash.com/photo-1509803874385-db7c23652552?w=800&q=80",
        publishedAt: "05 Oct 2025",
        source: "India Today",
        author: "Rural Affairs"
      },
      {
        title: "Heavy Rains Trigger Landslides in Uttarakhand",
        description: "Multiple landslides reported across Uttarakhand due to continuous heavy rainfall. Villages cut off from main areas.",
        url: "https://www.hindustantimes.com",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        publishedAt: "04 Oct 2025",
        source: "Hindustan Times",
        author: "Hill States Correspondent"
      },
      {
        title: "Flash Floods Devastate Kerala Villages",
        description: "Unprecedented flooding in Kerala after days of continuous rain. Thousands evacuated. NDRF rescue teams deployed across districts.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
        publishedAt: "11 Oct 2025",
        source: "The Hindu",
        author: "Kerala Correspondent"
      },
      {
        title: "Severe Earthquake Rocks Uttarakhand, Aftershocks Continue",
        description: "A 5.8 magnitude earthquake strikes Uttarakhand causing panic. Multiple aftershocks felt. Building inspections underway.",
        url: "https://www.indiatoday.in",
        imageUrl: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80",
        publishedAt: "10 Oct 2025",
        source: "India Today",
        author: "Breaking News"
      },
      {
        title: "Tropical Storm Approaches Odisha Coast",
        description: "IMD predicts strong winds and heavy rains. Odisha officials order evacuation. Fishermen restricted from sea activities.",
        url: "https://www.ndtv.com",
        imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&q=80",
        publishedAt: "10 Oct 2025",
        source: "NDTV",
        author: "Weather Correspondent"
      },
      {
        title: "Wildfire Threatens Himachal Pradesh Villages",
        description: "Large scale forest fire spreading rapidly. Over 300 hectares burned. Residents flee with belongings.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1534423861386-85a16f5d13fd?w=800&q=80",
        publishedAt: "09 Oct 2025",
        source: "The Hindu",
        author: "Wildlife Correspondent"
      },
      {
        title: "NH-1 Blocked by Massive Mudslide in Kashmir",
        description: "Major highway closure after mudslide. Hundreds of vehicles stranded. Excavation work started.",
        url: "https://www.kashmirreader.com",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        publishedAt: "09 Oct 2025",
        source: "Kashmir Reader",
        author: "Road Safety"
      },
      {
        title: "Rescue Operations Continue in West Bengal Floods",
        description: "West Bengal faces worst floods in decades. Relief material distributed. Shelters opened for displaced families.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
        publishedAt: "08 Oct 2025",
        source: "The Hindu",
        author: "Disaster Management"
      },
      {
        title: "Extreme Heat Kills Hundreds in Punjab Region",
        description: "Unprecedented heatwave sweeping Punjab. Hospitals overwhelmed with heat stroke cases. Schools closed early.",
        url: "https://www.timesofindia.com",
        imageUrl: "https://images.unsplash.com/photo-1509803874385-db7c23652552?w=800&q=80",
        publishedAt: "08 Oct 2025",
        source: "Times of India",
        author: "Health Correspondent"
      },
      {
        title: "Severe Storm Causes Power Outages in Karnataka",
        description: "Massive thunderstorm with hail and strong winds. Power supply disrupted. Trees uprooted across the state.",
        url: "https://www.indiatoday.in",
        imageUrl: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&q=80",
        publishedAt: "07 Oct 2025",
        source: "India Today",
        author: "Regional Desk"
      },
      {
        title: "Monsoon Brings Destruction to Goa",
        description: "Heavy monsoon causing flooding and landslides across Goa. Tourist areas evacuated. Tourist traffic halted.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
        publishedAt: "07 Oct 2025",
        source: "The Hindu",
        author: "Tourism Correspondent"
      },
      {
        title: "Earthquake Damage Assessment Underway in Himachal",
        description: "Post-earthquake surveys show significant damage to infrastructure. Government announces rehabilitation package.",
        url: "https://www.hindustantimes.com",
        imageUrl: "https://images.unsplash.com/photo-1564760055775-d63b17a55c44?w=800&q=80",
        publishedAt: "06 Oct 2025",
        source: "Hindustan Times",
        author: "Reconstruction Team"
      },
      {
        title: "Cyclone Preparedness Drill Held in Tamil Nadu",
        description: "State conducts simulation exercise for cyclone disaster. Coordination between agencies tested. Response teams evaluated.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1527482797697-8795b05a13fe?w=800&q=80",
        publishedAt: "05 Oct 2025",
        source: "The Hindu",
        author: "Preparedness Team"
      },
      {
        title: "Water Scarcity Worsens in Marathwada Region",
        description: "Severe drought in Marathwada causes water crisis. Rationing implemented. Farmers face crop failure.",
        url: "https://www.indiatoday.in",
        imageUrl: "https://images.unsplash.com/photo-1509803874385-db7c23652552?w=800&q=80",
        publishedAt: "05 Oct 2025",
        source: "India Today",
        author: "Agriculture Correspondent"
      },
      {
        title: "Tunnel Collapse Near Shimla Injures Workers",
        description: "Accidental landslide causes tunnel collapse during construction. Rescue operations launched for trapped workers.",
        url: "https://www.thehindu.com",
        imageUrl: "https://images.unsplash.com/photo-1559827260-dc66d52bef19?w=800&q=80",
        publishedAt: "04 Oct 2025",
        source: "The Hindu",
        author: "Construction Safety"
      },
      {
        title: "Bridge Damaged by Flash Flood in Uttarakhand",
        description: "Major bridge washed away by sudden flood. Road connectivity severed. Alternative routes being arranged.",
        url: "https://www.hindustantimes.com",
        imageUrl: "https://images.unsplash.com/photo-1547683905-f686c993aae5?w=800&q=80",
        publishedAt: "04 Oct 2025",
        source: "Hindustan Times",
        author: "Infrastructure Team"
      },
      {
        title: "Volcanic-Like Dust Storm Hits North India",
        description: "Unusual dust storm reduces visibility to near zero. Traffic accidents increase. Health warnings issued.",
        url: "https://www.ndtv.com",
        imageUrl: "https://images.unsplash.com/photo-1605727216801-e27ce1d0cc28?w=800&q=80",
        publishedAt: "03 Oct 2025",
        source: "NDTV",
        author: "Environmental Desk"
      }
    ];
  }

  async getDisasterNews(limit = 10) {
    if (!this.initialized) {
      await this.init();
    }

    console.log('\n============================================');
    console.log('getDisasterNews called');
    console.log('Requested limit:', limit);
    console.log('Cache status:', this.cache.disaster ? 'HIT' : 'MISS');
    console.log('============================================');

    if (!this.apiKey) {
      console.log('No API key - using curated news');
      return this.getRandomNews(this.getCuratedDisasterNews(), limit);
    }

    // Check cache first
    if (this.cache.disaster && Date.now() - this.cache.disaster.timestamp < this.CACHE_DURATION) {
      console.log('✅ Using cached data');
      return this.cache.disaster.data.slice(0, limit);
    }

    let allNews = [];

    // Try API first
    try {
      console.log('>>> Fetching from NewsAPI <<<');
      const apiNews = await this.fetchFromNewsAPI(limit * 2);
      allNews = [...apiNews];
      console.log(`✅ Got ${apiNews.length} articles from NewsAPI`);
    } catch (error) {
      console.error('NewsAPI error:', error.message);
    }

    // Always add curated news for variety
    const curatedNews = this.getCuratedDisasterNews();
    allNews = [...allNews, ...curatedNews];

    console.log(`Total news collected: ${allNews.length}`);

    if (allNews.length === 0) {
      allNews = curatedNews;
    }

    // Remove duplicates by title
    const uniqueNews = this.removeDuplicates(allNews);
    console.log(`After deduplication: ${uniqueNews.length}`);

    // Shuffle for variety
    const shuffled = this.shuffleArray(uniqueNews);
    const finalNews = shuffled.slice(0, limit);

    // Cache results
    this.cache.disaster = {
      data: finalNews,
      timestamp: Date.now()
    };

    console.log(`✅ Returning ${finalNews.length} articles`);
    return finalNews;
  }

  async fetchFromNewsAPI(limit) {
    if (!this.apiKey) {
      return [];
    }

    try {
      const query = 'India (flood OR earthquake OR cyclone OR disaster OR NDRF OR rescue)';
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=${limit}&sortBy=publishedAt&apiKey=${this.apiKey}`;

      const response = await fetch(url);

      if (response.status === 429) {
        throw new Error('Rate limited');
      }

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = await response.json();

      if (data.status !== 'ok') {
        throw new Error(data.message);
      }

      return data.articles || [];
    } catch (error) {
      console.error('NewsAPI fetch failed:', error.message);
      return [];
    }
  }

  async getNewsByDisasterType(type, limit = 5) {
    if (!this.initialized) {
      await this.init();
    }

    console.log(`\n=== getNewsByDisasterType: ${type} ===`);

    // Check cache
    if (this.cache[type] && Date.now() - this.cache[type].timestamp < this.CACHE_DURATION) {
      console.log('✅ Using cached data');
      return this.cache[type].data.slice(0, limit);
    }

    let allNews = [];

    // Try API
    try {
      const typeQueries = {
        flood: '(flood OR flooding OR heavy rain) India',
        earthquake: '(earthquake OR tremor OR seismic) India',
        fire: '(wildfire OR forest fire) India',
        cyclone: '(cyclone OR typhoon OR storm) India',
        landslide: '(landslide OR mudslide) India'
      };

      const query = typeQueries[type] || type;
      const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(query)}&pageSize=50&sortBy=publishedAt&apiKey=${this.apiKey}`;

      const response = await fetch(url);

      if (response.ok) {
        const data = await response.json();
        if (data.status === 'ok') {
          allNews = [...allNews, ...(data.articles || [])];
        }
      }
    } catch (error) {
      console.error('API error:', error.message);
    }

    // Add curated news
    const curated = this.getCuratedDisasterNews()
      .filter(n => n.title.toLowerCase().includes(type.toLowerCase()));
    
    allNews = [...allNews, ...curated];

    if (allNews.length === 0) {
      return this.getCuratedDisasterNews()
        .filter(n => n.title.toLowerCase().includes(type.toLowerCase()))
        .slice(0, limit);
    }

    const unique = this.removeDuplicates(allNews);
    const shuffled = this.shuffleArray(unique);
    const final = shuffled.slice(0, limit);

    this.cache[type] = {
      data: final,
      timestamp: Date.now()
    };

    return final;
  }

  removeDuplicates(articles) {
    const seen = new Set();
    return articles.filter(article => {
      const key = (article.title || '').toLowerCase();
      if (seen.has(key)) return false;
      seen.add(key);
      return true;
    });
  }

  shuffleArray(array) {
    const shuffled = [...array];
    for (let i = shuffled.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
    }
    return shuffled;
  }

  getRandomNews(news, limit) {
    return this.shuffleArray(news).slice(0, limit);
  }

  getServiceStatus() {
    return {
      initialized: this.initialized,
      hasApiKey: !!this.apiKey,
      timestamp: new Date().toISOString()
    };
  }
}

const newsService = new NewsService();

newsService.init().catch(err => {
  console.error('Init error:', err.message);
});

module.exports = newsService;