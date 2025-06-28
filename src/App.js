import React, { useState, useEffect, useCallback } from 'react';
import { Search, Plus, X, RefreshCw, Loader, TrendingUp, TrendingDown, AlertTriangle, ExternalLink } from 'lucide-react';

// Updated RSS feeds with better working URLs and additional sources
const RSS_FEEDS = {
  'economictimes': 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Feconomictimes.indiatimes.com%2Fmarkets%2Frssfeeds%2F1977021501.cms',
  'livemint': 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.livemint.com%2Frss%2Fmoney',
  'investing-india': 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fin.investing.com%2Frss%2Fnews_25.rss',
  'moneycontrol-alt': 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.moneycontrol.com%2Frss%2Fbusinessnews.xml',
  'business-today': 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.businesstoday.in%2Frss%2Fstory',
  'financial-express': 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.financialexpress.com%2Frss%2Fmarket%2F',
  'ndtv-profit': 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.ndtv.com%2Frss%2Fbusiness',
  'hindu-business': 'https://api.rss2json.com/v1/api.json?rss_url=https%3A%2F%2Fwww.thehindubusinessline.com%2Ffeeds%2FrssNews%2F%3Fcategory%3Dstocks',
};

// Comprehensive Indian stock symbols with sectors
const INDIAN_STOCKS = [
  // IT Sector
  'TCS', 'INFY', 'WIPRO', 'HCLTECH', 'TECHM', 'LTI', 'MINDTREE', 'MPHASIS',
  // Banking
  'HDFCBANK', 'ICICIBANK', 'SBIN', 'AXISBANK', 'KOTAKBANK', 'INDUSINDBK', 'BANKBARODA', 'PNB',
  // Energy & Oil
  'RELIANCE', 'ONGC', 'IOC', 'BPCL', 'HINDPETRO', 'GAIL', 'COALINDIA', 'POWERGRID', 'NTPC',
  // FMCG
  'HINDUNILVR', 'ITC', 'NESTLEIND', 'BRITANNIA', 'GODREJCP', 'DABUR', 'MARICO', 'COLPAL',
  // Auto
  'MARUTI', 'TATAMOTORS', 'M&M', 'BAJAJ-AUTO', 'HEROMOTOCO', 'EICHERMOT', 'ASHOKLEY', 'TVSMOTOR',
  // Pharma
  'SUNPHARMA', 'DRREDDY', 'CIPLA', 'DIVISLAB', 'LUPIN', 'BIOCON', 'AUROPHARMA', 'CADILAHC',
  // Metals & Mining
  'TATASTEEL', 'JSWSTEEL', 'HINDALCO', 'VEDL', 'SAIL', 'JINDALSTEL', 'NMDC', 'MOIL',
  // Telecom
  'BHARTIARTL', 'IDEA', 'RCOM',
  // Others
  'LT', 'ULTRACEMCO', 'TITAN', 'ASIANPAINT', 'BAJFINANCE', 'APOLLOHOSP', 'SHREECEM', 'GRASIM',
  'BAJAJFINSV', 'ADANIPORTS', 'ADANIGREEN', 'ADANIENT', 'UPL', 'PIDILITIND', 'YESBANK', 'ZEEL',
  'CANFINHOME', 'HDFC', 'HDFCLIFE', 'SBILIFE', 'ICICIPRULI', 'BAJAJHLDNG'
];

// Enhanced sentiment analysis with financial context
const analyzeSentiment = (text) => {
  const textLower = text.toLowerCase();
  
  const strongNegative = [
    'fraud', 'scam', 'investigation', 'arrest', 'penalty', 'banned', 'suspended',
    'collapse', 'bankrupt', 'default', 'massive loss', 'crash', 'plunge', 'crisis',
    'fell sharply', 'dropped significantly', 'declined heavily', 'slumped', 'tumbled',
    'bloodbath', 'sell-off', 'correction', 'bear market', 'recession'
  ];
  
  const strongPositive = [
    'record high', 'all-time high', 'soared', 'surged', 'rallied', 'jumped significantly',
    'gained strongly', 'rose sharply', 'climbed', 'advanced', 'outperformed',
    'bull run', 'breakout', 'milestone', 'achievement', 'beat estimates'
  ];
  
  // Check for strong phrases first
  for (const phrase of strongNegative) {
    if (textLower.includes(phrase)) return 'negative';
  }
  
  for (const phrase of strongPositive) {
    if (textLower.includes(phrase)) return 'positive';
  }
  
  const positiveWords = [
    'up', 'gain', 'bull', 'rise', 'surge', 'growth', 'profit', 'strong', 'rally',
    'soar', 'jump', 'boost', 'upgrade', 'positive', 'buy', 'bullish', 'beats',
    'outperform', 'beat', 'exceed', 'higher', 'increased', 'improved', 'optimistic',
    'expansion', 'momentum', 'breakthrough', 'success'
  ];
  
  const negativeWords = [
    'down', 'loss', 'bear', 'fall', 'drop', 'decline', 'weak', 'miss', 'slide',
    'retreat', 'sell', 'downgrade', 'negative', 'bearish', 'correction', 'lower',
    'decreased', 'worsen', 'concern', 'risk', 'volatile', 'uncertainty', 'pressure',
    'challenges', 'disappointing', 'struggles'
  ];
  
  const words = textLower.split(/\W+/);
  let score = 0;
  
  words.forEach(word => {
    if (positiveWords.includes(word)) score += 1;
    if (negativeWords.includes(word)) score -= 1;
  });
  
  if (score > 1) return 'positive';
  if (score < -1) return 'negative';
  return 'neutral';
};

// Enhanced stock symbol extraction with company names
const extractStockSymbols = (text) => {
  const symbols = [];
  const textUpper = text.toUpperCase();
  
  // Check for exact matches
  INDIAN_STOCKS.forEach(stock => {
    const stockVariations = [
      stock,
      stock.replace('&', 'AND'),
      stock.replace('-', ''),
      stock + '.NS',
      stock + '.BSE'
    ];
    
    stockVariations.forEach(variation => {
      if (textUpper.includes(variation)) {
        if (!symbols.includes(stock)) {
          symbols.push(stock);
        }
      }
    });
  });
  
  // Company name mappings
  const companyNames = {
    'RELIANCE': ['reliance industries', 'ril', 'reliance ltd'],
    'TCS': ['tata consultancy', 'tcs', 'tata consultancy services'],
    'INFY': ['infosys', 'infy'],
    'HDFCBANK': ['hdfc bank', 'housing development finance corporation'],
    'ICICIBANK': ['icici bank', 'icici'],
    'BHARTIARTL': ['bharti airtel', 'airtel', 'bharti'],
    'MARUTI': ['maruti suzuki', 'maruti'],
    'BAJFINANCE': ['bajaj finance'],
    'TATASTEEL': ['tata steel'],
    'TATAMOTORS': ['tata motors'],
    'HINDUNILVR': ['hindustan unilever', 'hul'],
    'ITC': ['itc limited'],
    'SBIN': ['state bank of india', 'sbi'],
    'LT': ['larsen & toubro', 'l&t'],
    'ASIANPAINT': ['asian paints'],
    'TITAN': ['titan company'],
    'NESTLEIND': ['nestle india'],
    'ULTRACEMCO': ['ultratech cement'],
    'SUNPHARMA': ['sun pharma', 'sun pharmaceutical'],
    'WIPRO': ['wipro limited'],
    'ONGC': ['oil and natural gas corporation'],
    'COALINDIA': ['coal india'],
    'POWERGRID': ['power grid corporation'],
    'NTPC': ['ntpc limited'],
    'AXISBANK': ['axis bank'],
    'KOTAKBANK': ['kotak mahindra bank'],
    'M&M': ['mahindra & mahindra', 'mahindra'],
    'BAJAJ-AUTO': ['bajaj auto'],
    'DRREDDY': ['dr reddy', 'dr reddys'],
    'CIPLA': ['cipla limited'],
    'JSWSTEEL': ['jsw steel'],
    'HINDALCO': ['hindalco industries'],
    'VEDL': ['vedanta limited'],
    'TECHM': ['tech mahindra'],
    'HCLTECH': ['hcl technologies'],
    'DIVISLAB': ['divis laboratories']
  };
  
  Object.entries(companyNames).forEach(([symbol, names]) => {
    names.forEach(name => {
      if (textUpper.includes(name.toUpperCase()) && !symbols.includes(symbol)) {
        symbols.push(symbol);
      }
    });
  });
  
  return symbols;
};

// Enhanced RSS parsing with better filtering
const parseRSSFeed = (jsonData, source) => {
  try {
    if (!jsonData || !jsonData.items || !Array.isArray(jsonData.items)) {
      console.warn(`Invalid data structure from ${source}`);
      return [];
    }
    
    const articles = [];
    jsonData.items.forEach((item, index) => {
      try {
        const title = item.title || '';
        const description = item.description || item.content || '';
        const link = item.link || item.url || '';
        const pubDate = item.pubDate || item.published || '';
        
        if (!title.trim()) return;
        
        const fullText = `${title} ${description}`;
        const stockSymbols = extractStockSymbols(fullText);
        
        // Enhanced market-related keywords
        const marketKeywords = [
          'market', 'stock', 'share', 'equity', 'sensex', 'nifty', 'bse', 'nse',
          'trading', 'investment', 'investor', 'mutual fund', 'ipo', 'fpo',
          'dividend', 'earnings', 'quarterly', 'annual', 'financial', 'revenue',
          'profit', 'loss', 'growth', 'economy', 'economic', 'inflation',
          'interest rate', 'rbi', 'reserve bank', 'monetary policy', 'fiscal',
          'gdp', 'budget', 'taxation', 'corporate', 'business', 'industry',
          'sector', 'portfolio', 'fund', 'bond', 'commodity', 'gold', 'crude'
        ];
        
        const isMarketRelated = marketKeywords.some(keyword => 
          fullText.toLowerCase().includes(keyword)
        );
        
        if (stockSymbols.length > 0 || isMarketRelated) {
          articles.push({
            id: `${source}-${index}-${Date.now()}-${Math.random()}`,
            title: title.trim(),
            description: description.replace(/<[^>]*>/g, '').trim().substring(0, 400),
            companies: stockSymbols,
            date: pubDate ? new Date(pubDate) : new Date(),
            sentiment: analyzeSentiment(fullText),
            source: source.charAt(0).toUpperCase() + source.slice(1).replace('-', ' '),
            url: link,
            isMarketNews: stockSymbols.length === 0 && isMarketRelated,
            relevanceScore: stockSymbols.length > 0 ? stockSymbols.length + 2 : 1
          });
        }
      } catch (itemError) {
        console.warn(`Error parsing item ${index} from ${source}:`, itemError);
      }
    });

    return articles;
  } catch (error) {
    console.error(`Error parsing RSS feed from ${source}:`, error);
    return [];
  }
};

// Enhanced fetch with better error handling
const fetchRSSFeed = async (url, source, retryCount = 0) => {
  const maxRetries = 3;
  
  try {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 15000); // 15 second timeout
    
    const response = await fetch(url, {
      signal: controller.signal,
      headers: {
        'Accept': 'application/json',
        'User-Agent': 'Mozilla/5.0 (compatible; NewsBot/1.0)'
      }
    });
    
    clearTimeout(timeoutId);
    
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }
    
    const jsonData = await response.json();
    
    if (jsonData.status === 'error') {
      throw new Error(jsonData.message || 'RSS service error');
    }
    
    const articles = parseRSSFeed(jsonData, source);
    
    if (articles.length === 0 && retryCount === 0) {
      console.warn(`No articles found from ${source}, but no error occurred`);
    }
    
    return articles;
  } catch (error) {
    console.error(`Error fetching RSS feed from ${source} (attempt ${retryCount + 1}):`, error);
    
    if (retryCount < maxRetries && error.name !== 'AbortError') {
      const delay = Math.min(1000 * Math.pow(2, retryCount), 5000); // Exponential backoff
      await new Promise(resolve => setTimeout(resolve, delay));
      return fetchRSSFeed(url, source, retryCount + 1);
    }
    
    return [];
  }
};

const App = () => {
  const [news, setNews] = useState([]);
  const [watchlist, setWatchlist] = useState(['RELIANCE', 'TCS', 'INFY', 'HDFCBANK']);
  const [activeTab, setActiveTab] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [newStock, setNewStock] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [errors, setErrors] = useState([]);
  const [successCount, setSuccessCount] = useState(0);
  const [feedStatus, setFeedStatus] = useState({});

  // Fetch all RSS feeds
  const fetchAllFeeds = useCallback(async () => {
    setIsLoading(true);
    setErrors([]);
    setFeedStatus({});
    const allArticles = [];
    const feedErrors = [];
    let successfulFeeds = 0;
    const statusUpdates = {};

    const feedPromises = Object.entries(RSS_FEEDS).map(async ([source, url]) => {
      try {
        statusUpdates[source] = 'loading';
        setFeedStatus(prev => ({ ...prev, [source]: 'loading' }));
        
        const articles = await fetchRSSFeed(url, source);
        
        if (articles.length > 0) {
          successfulFeeds++;
          statusUpdates[source] = 'success';
          setFeedStatus(prev => ({ ...prev, [source]: 'success' }));
          return articles;
        } else {
          statusUpdates[source] = 'empty';
          setFeedStatus(prev => ({ ...prev, [source]: 'empty' }));
          feedErrors.push(`${source}: No articles found`);
          return [];
        }
      } catch (error) {
        statusUpdates[source] = 'error';
        setFeedStatus(prev => ({ ...prev, [source]: 'error' }));
        feedErrors.push(`${source}: ${error.message}`);
        return [];
      }
    });

    try {
      const results = await Promise.allSettled(feedPromises);
      results.forEach((result, index) => {
        if (result.status === 'fulfilled') {
          allArticles.push(...result.value);
        }
      });

      // Remove duplicates and sort
      const uniqueArticles = [];
      allArticles.forEach(article => {
        const isDuplicate = uniqueArticles.some(existing => {
          const titleSimilarity = existing.title.toLowerCase() === article.title.toLowerCase();
          const partialMatch = existing.title.length > 30 && article.title.length > 30 && 
            existing.title.substring(0, 60).toLowerCase() === article.title.substring(0, 60).toLowerCase();
          return titleSimilarity || partialMatch;
        });
        
        if (!isDuplicate) {
          uniqueArticles.push(article);
        }
      });

      // Sort by relevance and date
      uniqueArticles.sort((a, b) => {
        if (a.relevanceScore !== b.relevanceScore) {
          return b.relevanceScore - a.relevanceScore;
        }
        return new Date(b.date) - new Date(a.date);
      });
      
      setNews(uniqueArticles);
      setLastUpdate(new Date());
      setSuccessCount(successfulFeeds);
      
      if (feedErrors.length > 0) {
        setErrors(feedErrors);
      }
    } catch (error) {
      console.error('Error fetching feeds:', error);
      setErrors(['Failed to fetch news feeds. Please try again.']);
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Initialize data
  useEffect(() => {
    fetchAllFeeds();
    
    // Auto-refresh every 15 minutes
    const interval = setInterval(fetchAllFeeds, 15 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAllFeeds]);

  // Filter functions
  const getFilteredNews = useCallback(() => {
    return news.filter(article => {
      const matchesSearch = searchTerm === '' || 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.companies.some(company => company.toLowerCase().includes(searchTerm.toLowerCase()));
      return matchesSearch;
    });
  }, [news, searchTerm]);

  const getWatchlistNews = useCallback(() => {
    return news.filter(article => {
      const hasWatchlistCompany = article.companies && 
        article.companies.some(company => watchlist.includes(company));
      
      const matchesSearch = searchTerm === '' || 
        article.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
        article.description.toLowerCase().includes(searchTerm.toLowerCase());
      
      return hasWatchlistCompany && matchesSearch;
    });
  }, [news, watchlist, searchTerm]);

  // Watchlist management
  const addToWatchlist = () => {
    const stockUpper = newStock.toUpperCase().trim();
    if (stockUpper && !watchlist.includes(stockUpper) && INDIAN_STOCKS.includes(stockUpper)) {
      setWatchlist([...watchlist, stockUpper]);
      setNewStock('');
    }
  };

  const removeFromWatchlist = (stock) => {
    setWatchlist(watchlist.filter(s => s !== stock));
  };

  const filteredNews = getFilteredNews();
  const watchlistNews = getWatchlistNews();
  const currentNews = activeTab === 'all' ? filteredNews : watchlistNews;

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Desktop Ribbon - Top */}
      <div className="hidden md:block bg-gray-900 border-b border-gray-800">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <div className="text-xl font-bold text-red-500 flex items-center">
              📈 Stock News India
            </div>

            {/* Navigation */}
            <div className="flex space-x-1">
              <button
                onClick={() => setActiveTab('all')}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  activeTab === 'all' 
                    ? 'bg-blue-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                All News ({filteredNews.length})
              </button>
              <button
                onClick={() => setActiveTab('watchlist')}
                className={`px-6 py-2 rounded-lg transition-colors ${
                  activeTab === 'watchlist' 
                    ? 'bg-red-600 text-white' 
                    : 'text-gray-300 hover:text-white hover:bg-gray-800'
                }`}
              >
                Watchlist ({watchlistNews.length})
              </button>
            </div>

            {/* Controls */}
            <div className="flex items-center space-x-4">
              <div className="text-xs text-gray-400">
                <div>{successCount}/{Object.keys(RSS_FEEDS).length} sources active</div>
                {lastUpdate && (
                  <div>Updated: {lastUpdate.toLocaleTimeString()}</div>
                )}
              </div>
              <button
                onClick={fetchAllFeeds}
                disabled={isLoading}
                className="flex items-center px-4 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded-lg transition-colors"
              >
                {isLoading ? <Loader size={16} className="mr-2 animate-spin" /> : <RefreshCw size={16} className="mr-2" />}
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Ribbon - Bottom */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-900 border-t border-gray-800 z-50">
        <div className="flex">
          <button
            onClick={() => setActiveTab('all')}
            className={`flex-1 py-4 text-center transition-colors ${
              activeTab === 'all' 
                ? 'bg-blue-600 text-white' 
                : 'text-gray-300'
            }`}
          >
            <div className="text-sm font-medium">All News</div>
            <div className="text-xs">{filteredNews.length}</div>
          </button>
          <button
            onClick={() => setActiveTab('watchlist')}
            className={`flex-1 py-4 text-center transition-colors ${
              activeTab === 'watchlist' 
                ? 'bg-red-600 text-white' 
                : 'text-gray-300'
            }`}
          >
            <div className="text-sm font-medium">Watchlist</div>
            <div className="text-xs">{watchlistNews.length}</div>
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6 pb-20 md:pb-6">
        {/* Header for Mobile */}
        <div className="md:hidden mb-6">
          <h1 className="text-2xl font-bold text-red-500 mb-2 flex items-center">
            📈 Stock News India
          </h1>
          <div className="flex justify-between items-center">
            <div className="text-xs text-gray-400">
              <div>Sources: {successCount}/{Object.keys(RSS_FEEDS).length} active</div>
              <div>Updated: {lastUpdate ? lastUpdate.toLocaleTimeString() : 'Never'}</div>
            </div>
            <button
              onClick={fetchAllFeeds}
              disabled={isLoading}
              className="flex items-center px-3 py-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-600 rounded text-sm"
            >
              {isLoading ? <Loader size={14} className="mr-1 animate-spin" /> : <RefreshCw size={14} className="mr-1" />}
              Refresh
            </button>
          </div>
        </div>

        {/* Feed Status Display */}
        {Object.keys(feedStatus).length > 0 && (
          <div className="mb-4 p-4 bg-gray-900 border border-gray-700 rounded-lg">
            <h4 className="text-sm font-medium text-gray-300 mb-2">Feed Status:</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
              {Object.entries(feedStatus).map(([source, status]) => (
                <div key={source} className="flex items-center">
                  <div className={`w-2 h-2 rounded-full mr-2 ${
                    status === 'success' ? 'bg-green-500' :
                    status === 'loading' ? 'bg-yellow-500 animate-pulse' :
                    status === 'empty' ? 'bg-yellow-600' :
                    'bg-red-500'
                  }`}></div>
                  <span className="text-gray-400">{source.replace('-', ' ')}</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Error Display */}
        {errors.length > 0 && (
          <div className="mb-4 p-4 bg-yellow-900 border border-yellow-700 rounded-lg">
            <div className="flex items-center mb-2">
              <AlertTriangle size={16} className="text-yellow-400 mr-2" />
              <span className="text-yellow-400 font-medium">Feed Issues ({errors.length})</span>
            </div>
            <div className="text-sm text-yellow-200 max-h-20 overflow-y-auto">
              {errors.slice(0, 5).map((error, index) => (
                <div key={index} className="truncate">{error}</div>
              ))}
              {errors.length > 5 && <div>... and {errors.length - 5} more</div>}
            </div>
          </div>
        )}

        {/* Controls */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
          {/* Search */}
          <div className="lg:col-span-2">
            <div className="relative">
              <Search className="absolute left-3 top-3 text-gray-400" size={20} />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Search news, companies, or stock symbols..."
                className="w-full pl-10 pr-4 py-3 bg-gray-900 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          {/* Watchlist Management */}
          <div>
            <div className="flex">
              <input
                type="text"
                value={newStock}
                onChange={(e) => setNewStock(e.target.value.toUpperCase())}
                placeholder="Add stock (e.g., RELIANCE)"
                className="flex-1 px-3 py-3 bg-gray-900 border border-gray-700 rounded-l-lg text-white placeholder-gray-400 focus:border-red-500 focus:outline-none"
                onKeyPress={(e) => e.key === 'Enter' && addToWatchlist()}
                list="indian-stocks"
              />
              <datalist id="indian-stocks">
                {INDIAN_STOCKS.map(stock => (
                  <option key={stock} value={stock} />
                ))}
              </datalist>
              <button
                onClick={addToWatchlist}
                className="bg-red-600 hover:bg-red-700 px-4 rounded-r-lg transition-colors"
                title="Add to watchlist"
              >
                <Plus size={20} />
              </button>
            </div>
          </div>
        </div>

        {/* Watchlist Display */}
        {watchlist.length > 0 && (
          <div className="mb-6">
            <h3 className="text-sm font-medium text-gray-300 mb-2">Your Watchlist:</h3>
            <div className="flex flex-wrap gap-2">
              {watchlist.map(stock => (
                <span
                  key={stock}
                  className="bg-gray-800 border border-gray-700 px-3 py-1 rounded-full text-sm flex items-center hover:bg-gray-700 transition-colors"
                >
                  {stock}
                  <button
                    onClick={() => removeFromWatchlist(stock)}
                    className="ml-2 text-gray-400 hover:text-red-400"
                  >
                    <X size={14} />
                  </button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* News List */}
        <div className="space-y-4">
          {currentNews.length === 0 ? (
            <div className="text-center py-12 text-gray-400">
              {isLoading ? (
                <div className="flex items-center justify-center">
                  <Loader className="animate-spin mr-2" size={20} />
                  Loading news from {Object.keys(RSS_FEEDS).length} sources...
                </div>
              ) : (
                <div>
                  <p>No news found</p>
                  <p className="text-sm mt-2">
                    {activeTab === 'watchlist' ? 'Add stocks to your watchlist or try searching' : 'Try adjusting your search terms or refresh to get latest news'}
                  </p>
                  {errors.length > 0 && (
                    <p className="text-sm mt-2 text-yellow-400">
                      Some news sources are currently unavailable. Try refreshing.
                    </p>
                  )}
                </div>
              )}
            </div>
          ) : (
            currentNews.map(article => (
              <div key={article.id} className="bg-gray-900 border border-gray-800 rounded-lg p-4 hover:border-gray-700 transition-colors">
                {/* Header */}
                <div className="flex flex-wrap items-center gap-2 mb-3">
                  {/* Companies */}
                  {article.companies && article.companies.length > 0 && article.companies.map(company => (
                    <span key={company} className="bg-blue-600 text-white px-2 py-1 rounded text-xs font-medium">
                      {company}
                    </span>
                  ))}
                  
                  {/* Market News indicator */}
                  {article.isMarketNews && (
                    <span className="bg-purple-600 text-white px-2 py-1 rounded text-xs font-medium">
                      Market News
                    </span>
                  )}
                  
                  {/* Sentiment */}
                  <span className={`px-2 py-1 rounded text-xs flex items-center ${
                    article.sentiment === 'positive' ? 'bg-green-900 text-green-400' :
                    article.sentiment === 'negative' ? 'bg-red-900 text-red-400' :
                    'bg-gray-800 text-gray-400'
                  }`}>
                    {article.sentiment === 'positive' ? <TrendingUp size={12} className="mr-1" /> :
                    article.sentiment === 'negative' ? <TrendingDown size={12} className="mr-1" /> : null}
                    {article.sentiment}
                  </span>
                  
                  {/* Source */}
                  <span className="text-gray-500 text-xs">{article.source}</span>
                  
                  {/* Date */}
                  <span className="text-gray-500 text-xs ml-auto">
                    {article.date.toLocaleDateString()} {article.date.toLocaleTimeString()}
                  </span>
                </div>
                
                {/* Title */}
                <h3 className="text-lg font-semibold text-white mb-2 hover:text-blue-400 transition-colors">
                  {article.url ? (
                    <a href={article.url} target="_blank" rel="noopener noreferrer">
                      {article.title}
                    </a>
                  ) : (
                    article.title
                  )}
                </h3>
                
                {/* Description */}
                {article.description && (
                  <p className="text-gray-300 text-sm leading-relaxed">
                    {article.description}
                  </p>
                )}
              </div>
            ))
          )}
        </div>

        {/* Status Indicator */}
        {currentNews.length > 0 && (
          <div className="text-center py-6 text-gray-400 text-sm">
            Showing {currentNews.length} articles from {successCount} sources
            {lastUpdate && (
              <div className="mt-1">
                Last updated: {lastUpdate.toLocaleString()}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default App;