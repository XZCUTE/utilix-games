// Global variables
// Debug logging for network issues
console.log('Current URL:', window.location.href);
console.log('Current path:', window.location.pathname);
console.log('Current origin:', window.location.origin);
// Log fetch errors globally
window.addEventListener('error', function(e) {
  console.error('Global error caught:', e.message, e.filename);
});
// Log network errors
window.addEventListener('unhandledrejection', function(e) {
  console.error('Unhandled promise rejection (network error?):', e.reason);
});

let gamesData = [];
let additionalGames = []; // Store additional games separately
let filteredGames = [];
let currentPage = 1;
const gamesPerPage = 12;
let currentFilter = 'all';
let currentSearchTerm = '';
let isLoading = false;
let hasMoreGames = true;

// DOM Elements
const gamesContainer = document.getElementById('games-container');
const newGamesContainer = document.getElementById('new-games-container');
const loadMoreBtn = document.getElementById('load-more-btn');
const filterBtns = document.querySelectorAll('.filter-btn');
const footerFilters = document.querySelectorAll('.footer-filter');
const menuToggle = document.querySelector('.menu-toggle');
const navLinks = document.querySelector('.nav-links');
const modal = document.getElementById('game-modal');
const closeModal = document.getElementById('close-modal');
const loaderContainer = document.querySelector('.loader-container');
const searchInput = document.getElementById('game-search');
const searchBtn = document.getElementById('search-btn');

// Event Listeners
document.addEventListener('DOMContentLoaded', initApp);

// Add event listeners for search
if (searchInput) {
    searchInput.addEventListener('keyup', (e) => {
        // Trigger search on Enter key
        if (e.key === 'Enter') {
            handleSearch();
        }
        
        // If backspace to empty, reset search
        if (e.key === 'Backspace' && searchInput.value === '') {
            resetSearch();
        }
    });
}

if (searchBtn) {
    searchBtn.addEventListener('click', handleSearch);
}

// Add event listeners to filter buttons
filterBtns.forEach(btn => {
    btn.addEventListener('click', (e) => {
        e.preventDefault();
        const category = btn.getAttribute('data-filter');
        filterGamesByCategory(category);
        
        // Remove active class from all buttons
        filterBtns.forEach(b => b.classList.remove('active'));
        // Add active class to clicked button
        btn.classList.add('active');
    });
});

// Add event listener for the Special button
const specialBtn = document.querySelector('.special-btn');
if (specialBtn) {
    specialBtn.addEventListener('click', (e) => {
        e.preventDefault();
        
        // Remove active class from all filter buttons
        filterBtns.forEach(btn => btn.classList.remove('active'));
        
        // Reset filters to show all games in the new games section
        currentFilter = 'all';
        applyFilters();
        
        // Display all additional games in the new games section
        displayNewGames(additionalGames);
        
        // Scroll to the new games section with a smooth animation
        const newGamesSection = document.getElementById('new-games');
        if (newGamesSection) {
            newGamesSection.scrollIntoView({ 
                behavior: 'smooth',
                block: 'start'
            });
            
            // Add highlight animation to the section
            newGamesSection.classList.add('highlight-section');
            setTimeout(() => {
                newGamesSection.classList.remove('highlight-section');
            }, 1500);
        }
    });
}

// Add event listeners to footer filter links
footerFilters.forEach(link => {
    link.addEventListener('click', (e) => {
        e.preventDefault();
        const category = link.getAttribute('data-filter');
        filterGamesByCategory(category);
        window.scrollTo({
            top: document.getElementById('games').offsetTop - 100,
            behavior: 'smooth'
        });
    });
});

// Mobile menu toggle
menuToggle.addEventListener('click', () => {
    navLinks.classList.toggle('active');
});

// Close modal when clicking close button or outside modal
closeModal.addEventListener('click', closeGameModal);
window.addEventListener('click', (e) => {
    if (e.target === modal) {
        closeGameModal();
    }
});

// Initialize the application
async function initApp() {
    try {
        await loadGamesData();
        hideLoader();
        displayGames(filteredGames, currentPage);
        displayNewGames(additionalGames); // Display new games in separate section
        // Check if there are more games to load
        checkHasMoreGames();
        // Initialize the infinite scroll observer
        initInfiniteScroll();
    } catch (error) {
        console.error('Error initializing app:', error);
        hideLoader();
        showErrorMessage('Failed to load games. Please try again later.');
    }
}

// Load games data from the JSON files
async function loadGamesData() {
    try {
        // Show loading status
        isLoading = true;
        
        // Load and parse both game files
        const [distributionGamesData, additionalGamesData] = await Promise.all([
            fetchAndParseGames('distributiongames.json'),
            fetchAndParseGames('additionalgames.json')
        ]);
        
        // Store additional games separately
        additionalGames = Array.isArray(additionalGamesData) ? additionalGamesData : [];
        
        // Combine games from both sources for the main display
        gamesData = [...(distributionGamesData || []), ...(additionalGames || [])];
        console.log('Total games loaded:', gamesData.length, '(Main:', distributionGamesData?.length || 0, ', Additional:', additionalGames.length, ')');
        
        // Set filtered games to all games initially
        filteredGames = [...gamesData];
        return gamesData;
    } catch (error) {
        console.error('Error loading games data:', error);
        throw error;
    } finally {
        isLoading = false;
    }
}

// Helper function to fetch and parse a game file
async function fetchAndParseGames(fileName) {
    try {
        // Create a more robust URL that works in all environments
        const baseUrl = new URL(fileName, window.location.href).href;
        console.log(`Attempting to fetch from: ${baseUrl} (original: ${fileName})`);
        
        const response = await fetch(baseUrl);
        if (!response.ok) {
            console.warn(`Error loading from ${baseUrl}: ${response.status}`);
            return [];
        }
        
        const text = await response.text();
        if (!text.trim()) {
            console.warn(`Empty file: ${fileName}`);
            return [];
        }
        
        // Parse the JSON
        const data = JSON.parse(text);
        console.log(`Successfully parsed ${fileName}`);
        
        // Extract games based on the structure
        let games = [];
        
        if (Array.isArray(data)) {
            // Format: [{game: {...}}, {game: {...}}]
            games = data.map(item => {
                // Handle both formats: {game: {...}} and directly {...}
                return item.game || item;
            });
        } else if (data && data.games && Array.isArray(data.games)) {
            // Format: {games: [{...}, {...}]}
            games = data.games.map(item => item.game || item);
        } else if (data && typeof data === 'object') {
            // Single game object
            games = [data.game || data];
        }
        
        // Ensure each game has a valid URL for iframe embedding
        games = games.filter(game => game && (game.url || (game.assetList && game.assetList.length > 0)));
        
        console.log(`Extracted ${games.length} games from ${fileName}`);
        return games;
    } catch (error) {
        console.error(`Error processing ${fileName}:`, error);
        return [];
    }
}

// Set up the Intersection Observer for infinite scrolling
function initInfiniteScroll() {
    // Create a sentinel element to observe
    const sentinel = document.createElement('div');
    sentinel.id = 'scroll-sentinel';
    sentinel.style.height = '1px'; // Small, invisible element
    gamesContainer.after(sentinel);

    // Create the intersection observer
    const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            // When the sentinel comes into view and we're not already loading
            if (entry.isIntersecting && !isLoading && hasMoreGames) {
                loadMoreGames();
            }
        });
    }, {
        // Start loading more content when sentinel is 200px from viewport
        rootMargin: '0px 0px 200px 0px'
    });

    // Observe the sentinel element
    observer.observe(sentinel);
}

// Display games in the container
function displayGames(games, page) {
    // Clear loading spinner if it exists
    const loadingSpinner = gamesContainer.querySelector('.loading-spinner');
    if (loadingSpinner) {
        gamesContainer.removeChild(loadingSpinner);
    }

    // Calculate start and end indices for pagination
    const start = (page - 1) * gamesPerPage;
    const end = page * gamesPerPage;
    const pagesToDisplay = games.slice(start, end);

    if (page === 1) {
        gamesContainer.innerHTML = '';
    }

    if (pagesToDisplay.length === 0 && page === 1) {
        gamesContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-search fa-3x"></i>
                <h3>No games found</h3>
                <p>Try a different search term or category</p>
            </div>
        `;
        // Hide load more button
        if (loadMoreBtn) loadMoreBtn.style.display = 'none';
        return;
    }

    pagesToDisplay.forEach(game => {
        const gameCard = createGameCard(game);
        gamesContainer.appendChild(gameCard);
    });
}

// Helper function to get the best available image URL for a game
function getGameImageUrl(game) {
    let imageUrl = 'img/placeholder.jpg';
    
    // First try gamedistribution thumbnails if we can construct the URL
    if (game.url && game.url.includes('gamedistribution.com')) {
        try {
            // Extract the game ID from the URL
            const urlParts = game.url.split('/');
            const gdGameId = urlParts[3].split('?')[0];
            if (gdGameId && gdGameId.length > 10) {
                imageUrl = `https://img.gamedistribution.com/${gdGameId}-512x384.jpeg`;
            }
        } catch (error) {
            console.warn(`Failed to construct GameDistribution image URL for ${game.title}`, error);
        }
    }
    
    // If available, use the assetList
    if (game.assetList && game.assetList.length > 0) {
        const assetList = Array.isArray(game.assetList) ? game.assetList : [game.assetList];
        // Look for thumbnail images specifically
        const thumbnails = assetList.filter(asset => 
            asset.type === 'thumbnail' || 
            (asset.name && asset.name.includes('thumbnail')) ||
            (asset.url && asset.url.includes('thumbnail'))
        );
        
        if (thumbnails.length > 0) {
            // Prioritize assets with an explicit URL property
            const assetWithUrl = thumbnails.find(asset => asset.url);
            if (assetWithUrl) {
                imageUrl = assetWithUrl.url;
            } 
            // If no URL property, try the name property
            else if (thumbnails[0].name) {
                imageUrl = thumbnails[0].name;
            }
        } 
        // If no thumbnails found, use the first asset
        else if (assetList[0].url) {
            imageUrl = assetList[0].url;
        } else if (assetList[0].name) {
            imageUrl = assetList[0].name;
        }
    }
    
    // Also check for direct image property
    if (game.image) {
        imageUrl = game.image;
    }

    // Add fallback for game URLs from gamedistribution.com that might have been missed
    if (imageUrl === 'img/placeholder.jpg' && game.url && game.url.includes('gamedistribution.com')) {
        // One more attempt to extract game ID from URL
        try {
            const gdGameId = game.url.match(/\/([a-f0-9]{32})\//i);
            if (gdGameId && gdGameId[1]) {
                imageUrl = `https://img.gamedistribution.com/${gdGameId[1]}-512x384.jpeg`;
            }
        } catch (error) {
            console.warn(`Failed to extract GameDistribution ID for ${game.title}`, error);
        }
    }
    
    return imageUrl;
}

// Create a game card element
function createGameCard(game) {
    const card = document.createElement('div');
    card.className = 'game-card';
    
    // Get the best available image URL
    const imageUrl = getGameImageUrl(game);
    
    // Get up to 3 categories
    const categories = game.categoryList 
        ? game.categoryList.slice(0, 3).map(cat => `<span class="game-category">${cat.name}</span>`).join('')
        : '';
    
    // Truncate description to 120 characters
    const description = game.description
        ? game.description.substring(0, 120) + (game.description.length > 120 ? '...' : '')
        : 'No description available';
    
    card.innerHTML = `
        <img src="${imageUrl}" alt="${game.title}" class="game-img" onerror="this.src='img/placeholder.jpg'">
        <div class="game-info">
            <h3 class="game-title">${game.title}</h3>
            <div class="game-category">${categories}</div>
            <div class="game-description">${description}</div>
            <div class="game-footer">
                <button class="btn play-btn">Play Now</button>
            </div>
        </div>
    `;
    
    // Add event listener to open game details modal
    card.addEventListener('click', () => openGameModal(game));
    
    return card;
}

// Open game modal with game data
function openGameModal(game) {
    // Update modal content with game data
    document.getElementById('modal-game-title').textContent = game.title;
    
    // Update image
    const modalImg = document.getElementById('modal-game-image');
    let imageUrl = getGameImageUrl(game);
    
    // Set the image with error handling
    modalImg.onerror = function() {
        console.warn(`Image failed to load for ${game.title}: ${imageUrl}`);
        this.src = 'img/placeholder.jpg';
        this.onerror = null; // Prevent infinite loops
    };
    
    modalImg.src = imageUrl;
    modalImg.alt = game.title;
    
    // Update categories
    const categoriesContainer = document.getElementById('modal-game-categories');
    if (game.categoryList && game.categoryList.length > 0) {
        categoriesContainer.innerHTML = game.categoryList
            .map(category => `<span class="category">${category.name}</span>`)
            .join('');
    } else {
        categoriesContainer.innerHTML = '<span class="category">Miscellaneous</span>';
    }
    
    // Update description
    document.getElementById('modal-game-description').innerHTML = `<p>${game.description || 'No description available.'}</p>`;
    
    // Update instructions
    document.getElementById('modal-game-instructions').innerHTML = game.instructions || 'No specific instructions provided. Use standard game controls.';
    
    // Set play button link - determine whether to use player.html or player
    const isCleanUrls = window.location.pathname === "/" || !window.location.pathname.includes('.html');
    const playerPath = isCleanUrls ? 'player' : 'player.html';
    const playBtn = document.getElementById('modal-play-btn');
    playBtn.href = `${playerPath}?id=${encodeURIComponent(game.title)}`;
    
    // Show modal
    modal.classList.add('show');
}

// Close game modal
function closeGameModal() {
    modal.classList.remove('show');
}

// Load more games
function loadMoreGames() {
    if (isLoading || !hasMoreGames) return;
    
    isLoading = true;
    currentPage++;
    
    // Show loading state
    const loadingSpinner = document.createElement('div');
    loadingSpinner.className = 'loading-spinner';
    loadingSpinner.innerHTML = '<i class="fas fa-spinner fa-spin"></i>';
    gamesContainer.appendChild(loadingSpinner);
    
    // Small delay to show loading state
    setTimeout(() => {
        displayGames(filteredGames, currentPage);
        isLoading = false;
        checkHasMoreGames();
    }, 500);
}

// Check if there are more games to load
function checkHasMoreGames() {
    const totalItems = filteredGames.length;
    const totalItemsLoaded = currentPage * gamesPerPage;
    hasMoreGames = totalItemsLoaded < totalItems;
    
    // Update load more button visibility
    if (loadMoreBtn) {
        loadMoreBtn.style.display = hasMoreGames ? 'block' : 'none';
    }
}

// Filter games by category
function filterGamesByCategory(category) {
    // Update current filter
    currentFilter = category;
    
    // Reset search if filtering
    currentSearchTerm = '';
    if (searchInput) {
        searchInput.value = '';
    }
    
    // Update section title based on category
    const sectionTitle = document.querySelector('.section-title h2');
    if (sectionTitle) {
        if (category === 'all') {
            sectionTitle.innerHTML = 'Featured Games';
        } else {
            sectionTitle.innerHTML = category;
        }
    }
    
    // Apply filters
    applyFilters();
    
    // Filter additional games for the New Games section
    if (newGamesContainer) {
        // If 'all' is selected, show all additional games
        if (category === 'all') {
            displayNewGames(additionalGames);
        } else {
            // Otherwise, filter additional games by category
            const filteredAdditionalGames = additionalGames.filter(game => {
                if (!game.categoryList) return false;
                return game.categoryList.some(cat => cat.name === category);
            });
            displayNewGames(filteredAdditionalGames);
        }
    }
}

// Apply both category and search filters
function applyFilters() {
    // Start with all games
    let filtered = [...gamesData];
    
    // Apply category filter if not 'all'
    if (currentFilter !== 'all') {
        filtered = filtered.filter(game => {
            if (!game.categoryList) return false;
            return game.categoryList.some(category => category.name === currentFilter);
        });
    }
    
    // Apply search filter if there's a search term
    if (currentSearchTerm) {
        filtered = filtered.filter(game => {
            const title = game.title ? game.title.toLowerCase() : '';
            const description = game.description ? game.description.toLowerCase() : '';
            
            return title.includes(currentSearchTerm) || description.includes(currentSearchTerm);
        });
    }
    
    // Reset pagination
    currentPage = 1;
    filteredGames = filtered;
    
    // Display the first page of filtered games
    displayGames(filteredGames, currentPage);
    
    // Check if there are more games to load
    checkHasMoreGames();
    
    // Scroll to games section
    window.scrollTo({
        top: document.getElementById('games').offsetTop - 100,
        behavior: 'smooth'
    });
}

// Show error message
function showErrorMessage(message) {
    gamesContainer.innerHTML = `
        <div class="error-message">
            <i class="fas fa-exclamation-circle fa-3x"></i>
            <h3>Oops! Something went wrong</h3>
            <p>${message}</p>
            <button class="btn" onclick="location.reload()">Try Again</button>
        </div>
    `;
    if (loadMoreBtn) loadMoreBtn.style.display = 'none';
}

// Hide the loader
function hideLoader() {
    loaderContainer.style.display = 'none';
}

// Show the loader
function showLoader() {
    loaderContainer.style.display = 'flex';
}

// Additional utility function for debugging
function logGamesData() {
    console.log('Total games loaded:', gamesData.length);
    console.log('Filtered games:', filteredGames.length);
    console.log('Current page:', currentPage);
    console.log('Current filter:', currentFilter);
    console.log('Current search term:', currentSearchTerm);
}

// Handle search
function handleSearch() {
    if (!searchInput) return;
    
    const searchTerm = searchInput.value.trim().toLowerCase();
    if (searchTerm.length < 2) {
        // Require at least 2 characters for search
        if (searchTerm.length > 0) {
            showNotification('Please enter at least 2 characters to search');
        }
        return;
    }
    
    currentSearchTerm = searchTerm;
    applyFilters();
    
    // Also filter the New Games section
    if (newGamesContainer) {
        const filteredAdditionalGames = additionalGames.filter(game => {
            const title = game.title ? game.title.toLowerCase() : '';
            const description = game.description ? game.description.toLowerCase() : '';
            
            return title.includes(searchTerm) || description.includes(searchTerm);
        });
        displayNewGames(filteredAdditionalGames);
    }
    
    // Add UI indicator that search is active
    document.body.classList.add('search-active');
    if (searchInput.parentElement) {
        searchInput.parentElement.classList.add('search-active');
    }
    
    // Update section title to show search results
    const sectionTitle = document.querySelector('.section-title h2');
    if (sectionTitle) {
        sectionTitle.innerHTML = `Search Results for "${searchTerm}"`;
    }
    
    // Also update the new games section title
    const newGamesSectionTitle = document.querySelector('#new-games .section-title h2');
    if (newGamesSectionTitle) {
        newGamesSectionTitle.innerHTML = `New Games - Search Results for "${searchTerm}"`;
    }
}

// Reset search
function resetSearch() {
    currentSearchTerm = '';
    if (searchInput) {
        searchInput.value = '';
    }
    applyFilters();
    
    // Reset the New Games section
    if (newGamesContainer) {
        displayNewGames(additionalGames);
    }
    
    // Remove active search UI indicators
    document.body.classList.remove('search-active');
    if (searchInput && searchInput.parentElement) {
        searchInput.parentElement.classList.remove('search-active');
    }
    
    // Reset section title
    const sectionTitle = document.querySelector('.section-title h2');
    if (sectionTitle) {
        sectionTitle.innerHTML = 'Featured Games';
    }
    
    // Reset new games section title
    const newGamesSectionTitle = document.querySelector('#new-games .section-title h2');
    if (newGamesSectionTitle) {
        newGamesSectionTitle.innerHTML = 'Newly Added Games';
    }
}

// Show notification
function showNotification(message) {
    // Create notification element
    const notification = document.createElement('div');
    notification.className = 'notification';
    notification.innerHTML = message;
    
    // Add to body
    document.body.appendChild(notification);
    
    // Show notification
    setTimeout(() => {
        notification.classList.add('show');
    }, 100);
    
    // Remove after 3 seconds
    setTimeout(() => {
        notification.classList.remove('show');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 300);
    }, 3000);
}

// Create first letter game card for the new games section
function createFirstLetterCard(game) {
    const gameCard = document.createElement('div');
    gameCard.className = 'first-letter-card';
    
    // Get the first letter of the game title
    const firstLetter = game.title.charAt(0).toUpperCase();
    
    // Get game image using the helper function
    const gameImage = getGameImageUrl(game);
    
    // Generate a consistent background color based on the first letter
    const letterColors = {
        'A': 'linear-gradient(135deg, #9147ff, #7033cc)',
        'B': 'linear-gradient(135deg, #ff5ebc, #cc4a96)',
        'C': 'linear-gradient(135deg, #1fa2ff, #1670cc)',
        'D': 'linear-gradient(135deg, #ff7846, #cc602f)',
        'E': 'linear-gradient(135deg, #44b9ff, #3894cc)',
        'F': 'linear-gradient(135deg, #ff4b4b, #cc3c3c)',
        'G': 'linear-gradient(135deg, #a347ff, #8239cc)',
        'H': 'linear-gradient(135deg, #ff9f43, #cc7f36)',
        'I': 'linear-gradient(135deg, #00c16e, #009955)',
        'J': 'linear-gradient(135deg, #8e2de2, #7024b5)',
        'K': 'linear-gradient(135deg, #ff6b6b, #cc5656)',
        'L': 'linear-gradient(135deg, #4158d0, #3446a6)',
        'M': 'linear-gradient(135deg, #43c6ac, #36a689)',
        'N': 'linear-gradient(135deg, #ffb347, #cc8f39)',
        'O': 'linear-gradient(135deg, #0acffe, #08a7cc)',
        'P': 'linear-gradient(135deg, #9733ee, #792dbe)',
        'Q': 'linear-gradient(135deg, #e0334d, #b3293d)',
        'R': 'linear-gradient(135deg, #ee9ca7, #be7d86)',
        'S': 'linear-gradient(135deg, #f6d365, #c5a951)',
        'T': 'linear-gradient(135deg, #56ab2f, #458c26)',
        'U': 'linear-gradient(135deg, #b993d6, #9476ab)',
        'V': 'linear-gradient(135deg, #614385, #4e366a)',
        'W': 'linear-gradient(135deg, #5f2c82, #4c2368)',
        'X': 'linear-gradient(135deg, #f83600, #c62b00)',
        'Y': 'linear-gradient(135deg, #c71d6f, #9f1759)',
        'Z': 'linear-gradient(135deg, #5433ff, #4328cc)'
    };
    
    // Default gradient for numbers or symbols
    const backgroundGradient = letterColors[firstLetter] || 'linear-gradient(135deg, var(--primary-dark), var(--primary))';
    
    // Determine whether to use a letter or an image
    let displayElement;
    if (gameImage && gameImage !== 'img/placeholder.jpg') {
        // Use image if available
        displayElement = `
            <img src="${gameImage}" alt="${game.title}" onerror="this.onerror=null; this.parentElement.innerHTML='<span>${firstLetter}</span>'; this.parentElement.style.background='${backgroundGradient}';">
        `;
    } else {
        // Use letter display with gradient background
        displayElement = `
            <span>${firstLetter}</span>
        `;
    }
    
    gameCard.innerHTML = `
        <div class="new-badge">NEW</div>
        <div class="letter-display" style="background: ${gameImage !== 'img/placeholder.jpg' ? 'none' : backgroundGradient}">
            ${displayElement}
        </div>
        <div class="game-info">
            <h3 class="game-title">${game.title}</h3>
            <div class="game-category">
                ${game.categoryList ? game.categoryList.map(cat => `<span class="category">${cat.name}</span>`).slice(0, 2).join('') : '<span class="category">Miscellaneous</span>'}
            </div>
            <button class="play-btn">Play Now</button>
        </div>
    `;
    
    // Add click event for the card
    gameCard.addEventListener('click', () => {
        openGameModal(game);
    });
    
    return gameCard;
}

// Display new games in the dedicated section
function displayNewGames(games) {
    if (!newGamesContainer) return;
    
    // Clear container first
    newGamesContainer.innerHTML = '';
    
    if (games.length === 0) {
        newGamesContainer.innerHTML = `
            <div class="no-results">
                <i class="fas fa-info-circle fa-3x"></i>
                <h3>No new games available</h3>
                <p>Check back soon for new additions!</p>
            </div>
        `;
        return;
    }
    
    // Display new games with first letter display
    games.forEach(game => {
        const gameCard = createFirstLetterCard(game);
        newGamesContainer.appendChild(gameCard);
    });
}

// Create event delegation for play buttons inside game cards
document.addEventListener('click', function(event) {
    // Check if clicked element is a play button inside a game card
    if (event.target.classList.contains('play-btn')) {
        event.preventDefault();
        event.stopPropagation();
        
        // Find the parent game card and get the game title
        const gameCard = event.target.closest('.game-card, .first-letter-card');
        if (gameCard) {
            const gameTitle = gameCard.querySelector('.game-title').textContent;
            
            // Find the game in our data
            const game = [...gamesData, ...additionalGames].find(g => g.title === gameTitle);
            if (game) {
                // Determine whether to use player.html or player
                const isCleanUrls = window.location.pathname === "/" || !window.location.pathname.includes('.html');
                const playerPath = isCleanUrls ? 'player' : 'player.html';
                
                // Navigate to the player page with this game
                window.location.href = `${playerPath}?id=${encodeURIComponent(game.title)}`;
            }
        }
    }
});

// Helper function to get the best available image URL for a game
function getGameImageUrl(game) {
    let imageUrl = 'img/placeholder.jpg';
    
    // First try gamedistribution thumbnails if we can construct the URL
    if (game.url && game.url.includes('gamedistribution.com')) {
        try {
            // Extract the game ID from the URL
            const urlParts = game.url.split('/');
            const gdGameId = urlParts[3].split('?')[0];
            if (gdGameId && gdGameId.length > 10) {
                imageUrl = `https://img.gamedistribution.com/${gdGameId}-512x384.jpeg`;
            }
        } catch (error) {
            console.warn(`Failed to construct GameDistribution image URL for ${game.title}`, error);
        }
    }
    
    // If available, use the assetList
    if (game.assetList && game.assetList.length > 0) {
        const assetList = Array.isArray(game.assetList) ? game.assetList : [game.assetList];
        // Look for thumbnail images specifically
        const thumbnails = assetList.filter(asset => 
            asset.type === 'thumbnail' || 
            (asset.name && asset.name.includes('thumbnail')) ||
            (asset.url && asset.url.includes('thumbnail'))
        );
        
        if (thumbnails.length > 0) {
            // Prioritize assets with an explicit URL property
            const assetWithUrl = thumbnails.find(asset => asset.url);
            if (assetWithUrl) {
                imageUrl = assetWithUrl.url;
            } 
            // If no URL property, try the name property
            else if (thumbnails[0].name) {
                imageUrl = thumbnails[0].name;
            }
        } 
        // If no thumbnails found, use the first asset
        else if (assetList[0].url) {
            imageUrl = assetList[0].url;
        } else if (assetList[0].name) {
            imageUrl = assetList[0].name;
        }
    }
    
    // Also check for direct image property
    if (game.image) {
        imageUrl = game.image;
    }
    
    // Add fallback for game URLs from gamedistribution.com that might have been missed
    if (imageUrl === 'img/placeholder.jpg' && game.url && game.url.includes('gamedistribution.com')) {
        // One more attempt to extract game ID from URL
        try {
            const gdGameId = game.url.match(/\/([a-f0-9]{32})\//i);
            if (gdGameId && gdGameId[1]) {
                imageUrl = `https://img.gamedistribution.com/${gdGameId[1]}-512x384.jpeg`;
            }
        } catch (error) {
            console.warn(`Failed to extract GameDistribution ID for ${game.title}`, error);
        }
    }
    
    return imageUrl;
} 