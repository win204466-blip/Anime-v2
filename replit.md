# Zeeniatt - Anime Streaming Website

## Project Overview
Zeeniatt is a modern anime streaming website that scrapes data from oploverz.ch. The website features a clean, responsive design with dark theme and multiple cool features for better user experience.

**Live URL**: https://YOUR_REPLIT_DOMAIN.repl.co

## Recent Changes (October 25, 2025)
### Vercel Compatibility Fix ✅
- ✅ Fixed "FUNCTION_INVOCATION_FAILED" error di Vercel
- ✅ Tambahkan timeout 8 detik ke axios untuk menghindari serverless timeout
- ✅ Konfigurasi Express app agar kompatibel dengan Vercel serverless function
- ✅ Project sekarang bisa di-deploy baik di Vercel maupun Replit
- ✅ Restore vercel.json dengan routing yang benar

### Previous Updates (October 21, 2025)
- ✅ Fixed data loading issue by separating API endpoints (/api/popular and /api/home)
- ✅ Created modular architecture with separate pages (detail.html, watch.html)
- ✅ Implemented resolution switcher (360p, 480p, 720p, 1080p)
- ✅ Added continue watching feature using localStorage
- ✅ Added favorites/bookmark functionality
- ✅ Implemented dark mode toggle in watch page
- ✅ Added share and download episode list features
- ✅ Verified data fetching works correctly (10 popular anime + 12 total anime displayed)

## Project Structure
```
├── api/
│   └── index.js           # Express.js backend with scraping endpoints
├── public/
│   ├── index.html         # Main homepage (Popular + Anime List)
│   ├── detail.html        # Anime detail page (separate page)
│   ├── watch.html         # Video watching page (separate page)
│   ├── script.js          # Main page JavaScript
│   ├── detail.js          # Detail page JavaScript
│   ├── watch.js           # Watch page JavaScript
│   └── style.css          # Global styles
└── package.json           # Node.js dependencies
```

## API Endpoints

### Backend Routes
1. **GET /api/home** - Scrapes homepage anime from oploverz.ch
2. **GET /api/popular** - Scrapes popular anime from oploverz.ch/series/?order=popular
3. **GET /api/list** - Scrapes all anime list (currently having selector issues)
4. **GET /api/anime/:slug** - Gets anime detail including all episodes
5. **GET /api/episode/:slug** - Gets video streaming URL from episode page
6. **GET /api/search?q=query** - Searches anime by keyword

### API Response Format
All API responses follow this format:
```json
{
  "success": true/false,
  "data": [...],
  "error": "error message if any"
}
```

## Features

### Main Page (index.html)
- **Popular Section**: Displays 10-12 most popular anime with smart grouping for related seasons
- **Anime List Section**: Shows additional anime from homepage
- **Search Functionality**: Real-time search across all loaded anime
- **Responsive Grid**: Clean card layout with hover effects
- **Auto Banner**: Random anime as hero banner

### Detail Page (detail.html)
- **Anime Information**: Title, description, status, type, rating
- **Episode List**: All available episodes with navigation
- **Favorite Button**: Save anime to favorites (localStorage)
- **Related Anime**: Shows anime from the same series
- **Continue Watching**: Automatically resumes from last watched episode

### Watch Page (watch.html)
- **Video Player**: Embedded iframe player with streaming URL
- **Resolution Switcher**: Toggle between 360p, 480p, 720p, 1080p
- **Episode Sidebar**: Quick navigation to all episodes
- **Dark Mode Toggle**: Switch between light and dark themes
- **Share Feature**: Share current episode via Web Share API
- **Download List**: Export episode list as text file
- **Auto-save Progress**: Remembers last watched episode

## Technical Stack
- **Backend**: Node.js + Express.js
- **Scraping**: Cheerio + Axios
- **Frontend**: Vanilla JavaScript (no framework)
- **Styling**: Bootstrap 5 + Custom CSS
- **Icons**: Bootstrap Icons
- **Storage**: localStorage for client-side data

## Known Issues
- `/api/list` endpoint returns empty due to selector mismatch on oploverz.ch
- Using `/api/popular` as fallback for anime list
- Screenshot tool may not render dynamic content - test directly in browser for best results

## User Preferences
- Clean, modern dark-themed design
- Separate pages only for detail and watch functionality
- Keep main page as single-page application
- Focus on real features (no mock data)
- Mobile-responsive layout

## Development Notes
- Server runs on port 5000 (required for Replit environment)
- All pages use consistent navigation bar
- Smart anime grouping by series (removes seasons/episodes from base name)
- localStorage keys: `favorites`, `continueWatching`, `darkMode`
- CORS enabled for all origins

## How to Run
```bash
npm install
node api/index.js
```

Server will start on http://localhost:5000

## Deployment

### Deploy ke Vercel (Gratis)
1. Push project kamu ke GitHub repository
2. Buka [vercel.com](https://vercel.com) dan login dengan GitHub
3. Klik "Import Project" dan pilih repository kamu
4. Vercel akan otomatis detect konfigurasi dari `vercel.json`
5. Klik "Deploy" dan tunggu sampai selesai
6. Website kamu sudah online dengan URL gratis dari Vercel!

**Catatan Penting untuk Vercel:**
- Vercel serverless function punya limit waktu 10 detik (hobby plan)
- Axios timeout sudah di-set 8 detik agar tidak melebihi limit
- Semua dependencies akan otomatis terinstall dari `package.json`

### Deploy ke Replit (Alternatif)
Configure deployment with:
- Build: None required (no compilation needed)
- Run: `node api/index.js`
- Deployment Type: VM (for continuous running)

## Future Enhancements
- Fix `/api/list` scraping selector
- Add pagination for large anime lists
- Implement user accounts and cloud sync
- Add comment system for episodes
- Create admin panel for manual data entry
- Add anime recommendations based on watch history
