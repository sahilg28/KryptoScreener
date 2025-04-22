# KryptoScreener 🚀

Welcome to [KryptoScreener](https://kryptoscreener.vercel.app/), your ultimate tool for real-time cryptocurrency tracking and analysis! 📈

## Description 📝

KryptoScreener offers a dynamic and user-friendly platform to monitor cryptocurrency markets. Track live prices, explore market trends, and manage your personal watchlist of favorite cryptocurrencies. Whether you're a seasoned trader or a crypto newbie, KryptoScreener provides the tools you need to make informed decisions.

## Technology Used 🛠️

- **ReactJS**: For building a responsive and interactive UI.
- **TailwindCSS**: For sleek, mobile-first designs.
- **Lucide Icons**: Enhancing UI with expressive icons.
- **Vercel**: For seamless hosting and superior performance.

## Installation 📦

To get started with KryptoScreener locally, follow these steps:

1. Clone the repository:
   ```bash
   git clone https://github.com/sahilg28/KryptoScreener.git
   ```
2. Navigate to the project directory:
   ```bash
   cd KryptoScreener
   ```
3. Install dependencies:
   ```bash
   npm install
   ```
4. Start the development server:
   ```bash
   npm run dev
   ```

## Give Us a Star! ⭐

If you find KryptoScreener helpful, please consider giving us a star on [GitHub](https://github.com/sahilg28/KryptoScreener).

# KryptoScreener Mobile Responsive Implementation

This document summarizes the responsive design implementation for KryptoScreener to ensure it works well on mobile devices.

## Responsive Design Approach

KryptoScreener uses the following responsive design techniques:

1. **Mobile-first approach** with Tailwind CSS
2. **Responsive breakpoints** using Tailwind's `sm`, `md`, and `lg` modifiers
3. **Flexible layouts** using Grid and Flexbox
4. **Optimized typography** that scales based on screen size
5. **Hidden elements** on mobile when needed to preserve space
6. **Touch-friendly** button sizes and interactive elements

## Key Components Made Responsive

### Header & Navigation
- Mobile hamburger menu that expands on click
- Stacked mobile navigation with full-width items
- Resized logo and text for small screens
- Optimized wallet connection button for mobile

### Homepage
- Resized hero section with appropriate typography scaling
- Features section displays in a single column on mobile
- Reduced padding and margins on smaller screens
- Optimized card layouts for mobile viewing

### CryptoTable
- Table columns intelligently hidden on mobile (preserving essential data)
- Responsive search and filter controls
- Mobile-optimized pagination controls
- Card-style presentation for mobile users

### Fear & Greed Index
- Resized data visualization elements
- Responsive grid layout for market stats
- Optimized trending coins display for mobile
- Readable typography at all screen sizes

### CoinDetailsModal
- Full-screen modal on mobile with appropriate padding
- Responsive chart sizing
- Stacked data presentation on small screens
- Touch-friendly close button

### Watchlist Page
- Responsive table implementation showing critical data on mobile
- Clear touch targets for remove action
- Properly scaled empty state

### TrendingPage
- Card grid layout that adapts to screen width
- Responsive typography hierarchy
- Optimized coin information display for small screens

### PredictKrypto Game
- Full responsive implementation with appropriate sizing
- Mobile-friendly prediction buttons
- Responsive chart and controls
- Clear game state visualization at all screen sizes

## Utility Classes Added

The following utility classes were added to enhance responsive behavior:

```css
/* Responsive typography */
.text-responsive-xs { @apply text-xs sm:text-sm; }
.text-responsive-sm { @apply text-sm sm:text-base; }
.text-responsive-base { @apply text-base sm:text-lg; }
.text-responsive-lg { @apply text-lg sm:text-xl md:text-2xl; }
.text-responsive-xl { @apply text-xl sm:text-2xl md:text-3xl; }

/* Responsive container padding */
.container-responsive { @apply px-3 sm:px-4 md:px-6; }

/* Responsive layouts */
.flex-responsive-col { @apply flex flex-col sm:flex-row; }
.flex-responsive-wrap { @apply flex flex-wrap gap-2; }
.grid-responsive-1 { @apply grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4; }
.grid-responsive-2 { @apply grid grid-cols-1 sm:grid-cols-2 gap-4; }

/* Mobile specific fixes */
@media (max-width: 640px) {
  .tooltip { max-width: 200px; }
  .truncate-mobile { max-width: 120px; overflow: hidden; text-overflow: ellipsis; }
  .chart-container { height: 200px !important; }
}
```

## Mobile Testing Guidelines

When testing the responsive implementation, pay attention to:

1. Navigation usability on small screens
2. Text readability at all screen sizes
3. Touch target sizes (buttons, links, interactive elements)
4. Content flow and hierarchy
5. Visual elements scaling appropriately
6. Load time optimization for mobile networks

## Future Improvements

Potential future improvements for mobile:

1. Implement native-like bottom navigation for frequently accessed features
2. Add pull-to-refresh functionality on data-heavy pages
3. Implement lazy loading for improved mobile performance
4. Add offline capabilities for core functionality
5. Optimize images further for mobile data considerations
