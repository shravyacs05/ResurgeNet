// backend/services/newsService.js
class NewsService {
  constructor() {
    this.apiKey = process.env.NEWS_API_KEY;
    this.baseURL = 'https://newsapi.org/v2';
    this.initialized = false;
  }

  async init() {
    if (this.initialized) return;
    
    if (!this.apiKey) {
      throw new Error('NewsAPI key is required. Please set NEWS_API_KEY in .env');
    }

    console.log('📰 Initializing NewsAPI service...');
    this.initialized = true;
    console.log('✅ NewsAPI service initialized successfully');
  }

  // Disaster-related keywords for India
  getDisasterKeywords() {
    return [
      'flood', 'earthquake', 'cyclone', 'landslide', 'tsunami',
      'fire', 'wildfire', 'storm', 'drought', 'heatwave',
      'cold wave', 'epidemic', 'pandemic', 'accident', 'disaster',
      'NDMA', 'NDRF', 'rescue', 'relief', 'emergency',
      'monsoon', 'rain', 'flooding', 'quake', 'tremor'
    ];
  }

  // Indian states and cities for localized news
  getIndianLocations() {
    return [
      'India', 'Delhi', 'Mumbai', 'Chennai', 'Kolkata', 'Bangalore', 'Hyderabad',
      'Pune', 'Ahmedabad', 'Jaipur', 'Lucknow', 'Bhopal', 'Patna', 'Chandigarh',
      'Dehradun', 'Guwahati', 'Bhubaneswar', 'Thiruvananthapuram', 'Kochi'
    ];
  }

  async getDisasterNews(limit = 10) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      console.log('📡 Fetching disaster news from NewsAPI...');

      const keywords = this.getDisasterKeywords();
      const locations = this.getIndianLocations();
      
      // Create search query for Indian disaster news
      const query = `(${keywords.join(' OR ')}) AND (${locations.join(' OR ')})`;
      
      const response = await fetch(
        `${this.baseURL}/everything?` + new URLSearchParams({
          q: query,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: limit.toString(),
          apiKey: this.apiKey
        })
      );

      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`NewsAPI returned error: ${data.message}`);
      }

      console.log(`✅ Found ${data.articles.length} disaster news articles`);
      
      // Filter and format the news
      return this.formatNews(data.articles);

    } catch (error) {
      console.error('❌ Error fetching disaster news:', error.message);
      return this.getFallbackNews();
    }
  }

  async getNewsByDisasterType(disasterType, limit = 5) {
    if (!this.initialized) {
      await this.init();
    }

    try {
      console.log(`📡 Fetching ${disasterType} news from NewsAPI...`);

      const locations = this.getIndianLocations();
      const query = `${disasterType} AND (${locations.join(' OR ')})`;
      
      const response = await fetch(
        `${this.baseURL}/everything?` + new URLSearchParams({
          q: query,
          language: 'en',
          sortBy: 'publishedAt',
          pageSize: limit.toString(),
          apiKey: this.apiKey
        })
      );

      if (!response.ok) {
        throw new Error(`NewsAPI error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      
      if (data.status !== 'ok') {
        throw new Error(`NewsAPI returned error: ${data.message}`);
      }

      console.log(`✅ Found ${data.articles.length} ${disasterType} news articles`);
      return this.formatNews(data.articles);

    } catch (error) {
      console.error(`❌ Error fetching ${disasterType} news:`, error.message);
      return this.getFallbackNewsByType(disasterType);
    }
  }

  formatNews(articles) {
    return articles
      .filter(article => 
        article.title && 
        article.title !== '[Removed]' && 
        article.urlToImage
      )
      .map(article => ({
        title: article.title,
        description: article.description || 'No description available',
        url: article.url,
        imageUrl: article.urlToImage,
        publishedAt: new Date(article.publishedAt).toLocaleDateString('en-IN', {
          day: 'numeric',
          month: 'short',
          year: 'numeric'
        }),
        source: article.source?.name || 'Unknown Source',
        author: article.author || 'Unknown Author'
      }))
      .slice(0, 10); // Limit to 10 articles
  }

  getFallbackNews() {
    console.log('📰 Using fallback disaster news data');
    return [
      {
        title: "NDRF Teams Deployed for Flood Rescue Operations in Assam",
        description: "National Disaster Response Force teams rescue hundreds from flood-affected areas in Assam.",
        url: "#",
        imageUrl: "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=400",
        publishedAt: "Recent",
        source: "ResurgeNet",
        author: "Emergency Alert"
      },
      {
        title: "Earthquake Preparedness Drill Conducted in Himalayan Region",
        description: "Disaster management authorities conduct mock drills for earthquake preparedness.",
        url: "#",
        imageUrl: "https://images.unsplash.com/photo-1506259091721-347e791bab0f?w=400",
        publishedAt: "Recent", 
        source: "ResurgeNet",
        author: "Safety Update"
      },
      {
        title: "Cyclone Warning Issued for Eastern Coastal Areas",
        description: "Meteorological department issues alert for coastal regions as cyclone approaches.",
        url: "#",
        imageUrl: "https://images.unsplash.com/photo-1504608524841-42fe6f032b4b?w=400",
        publishedAt: "Recent",
        source: "ResurgeNet",
        author: "Weather Alert"
      }
    ];
  }

  getFallbackNewsByType(disasterType) {
    const fallbackNews = {
      flood: [
        {
          title: "Flood Rescue Operations Underway in Multiple States",
          description: "Rescue teams evacuate residents from flood-affected areas across several states.",
          url: "#",
          imageUrl: "https://images.unsplash.com/photo-1589652717521-10c0d092dea9?w=400",
          publishedAt: "Recent",
          source: "ResurgeNet",
          author: "Flood Alert"
        }
      ],
      earthquake: [
        {
          title: "Seismic Activity Monitored in Northern Regions",
          description: "Authorities monitoring earthquake-prone zones with increased vigilance.",
          url: "#",
          imageUrl: "https://images.unsplash.com/photo-1506259091721-347e791bab0f?w=400",
          publishedAt: "Recent",
          source: "ResurgeNet", 
          author: "Seismic Update"
        }
      ],
      fire: [
        {
          title: "Fire Safety Campaign Launched in Urban Areas",
          description: "Fire department initiates safety awareness program for high-risk zones.",
          url: "#",
          imageUrl: "https://images.unsplash.com/photo-1582053433976-0c6c0b46b0a4?w=400",
          publishedAt: "Recent",
          source: "ResurgeNet",
          author: "Fire Safety"
        }
      ]
    };

    return fallbackNews[disasterType] || this.getFallbackNews();
  }
}

// Create and export instance
const newsService = new NewsService();

// Initialize but don't block server startup
newsService.init().catch(err => {
  console.error('Failed to initialize News service:', err.message);
});

module.exports = newsService;