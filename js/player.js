// Debug logging for network issues
console.log('Player.js - Current URL:', window.location.href);
console.log('Player.js - Current path:', window.location.pathname);
console.log('Player.js - Current origin:', window.location.origin);

// Global variables
let gameData = null;
let isTheaterMode = false;
let isFullscreen = false;
const gamesJsonUrl = 'distributiongames.json';

// DOM Elements
const gameTitle = document.getElementById('game-title');
const gameCanvas = document.getElementById('game-canvas');
const gameFrameContainer = document.getElementById('game-frame-container');
const loadingIndicator = document.getElementById('loading-indicator');
const playerContainer = document.getElementById('player-container');
const playerSidebar = document.getElementById('player-sidebar');
const gameCategories = document.getElementById('game-categories');
const gameDescription = document.getElementById('game-description');
const gameInstructions = document.getElementById('game-instructions');
const theaterModeBtn = document.getElementById('theater-mode-btn');
const fullscreenBtn = document.getElementById('fullscreen-btn');
const shareBtn = document.getElementById('share-btn');
const shareModal = document.getElementById('share-modal');
const shareLinkInput = document.getElementById('share-link-input');
const modalShareLinkInput = document.getElementById('modal-share-link-input');
const copyLinkBtn = document.getElementById('copy-link-btn');
const modalCopyLinkBtn = document.getElementById('modal-copy-link-btn');
const closeModalBtn = document.getElementById('close-modal');
const shareFacebookBtn = document.getElementById('share-facebook');
const shareTwitterBtn = document.getElementById('share-twitter');
const shareWhatsappBtn = document.getElementById('share-whatsapp');
const copyLinkBtnMain = document.getElementById('copy-link');
const modalShareFacebookBtn = document.getElementById('modal-share-facebook');
const modalShareTwitterBtn = document.getElementById('modal-share-twitter');
const modalShareWhatsappBtn = document.getElementById('modal-share-whatsapp');
const modalCopyLinkBtnMain = document.getElementById('modal-copy-link');
const playerHeader = document.querySelector('.player-header');

// Event Listeners
document.addEventListener('DOMContentLoaded', initPlayer);
theaterModeBtn.addEventListener('click', toggleTheaterMode);
fullscreenBtn.addEventListener('click', toggleFullscreen);
shareBtn.addEventListener('click', openShareModal);
closeModalBtn.addEventListener('click', closeShareModal);
copyLinkBtn.addEventListener('click', copyShareLink);
modalCopyLinkBtn.addEventListener('click', copyShareLink);
shareFacebookBtn.addEventListener('click', shareFacebook);
shareTwitterBtn.addEventListener('click', shareTwitter);
shareWhatsappBtn.addEventListener('click', shareWhatsapp);
copyLinkBtnMain.addEventListener('click', copyShareLink);
modalShareFacebookBtn.addEventListener('click', shareFacebook);
modalShareTwitterBtn.addEventListener('click', shareTwitter);
modalShareWhatsappBtn.addEventListener('click', shareWhatsapp);
modalCopyLinkBtnMain.addEventListener('click', copyShareLink);

// Add event listener for fullscreen change events
document.addEventListener('fullscreenchange', handleFullscreenChange);
document.addEventListener('webkitfullscreenchange', handleFullscreenChange);
document.addEventListener('mozfullscreenchange', handleFullscreenChange);
document.addEventListener('MSFullscreenChange', handleFullscreenChange);

// Add event listener for ESC key
document.addEventListener('keydown', handleKeyPress);

// Functions
function initPlayer() {
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    
    if (!gameId) {
        showError('Game ID is missing. Please go back and select a game.');
        return;
    }
    
    // Hide loader after 1.5 seconds for better UX
    setTimeout(() => {
        document.querySelector('.loader-container').style.display = 'none';
    }, 1500);
    
    loadGameData(gameId);
}

function loadGameData(gameId) {
    // Decode the gameId from the URL
    const decodedGameId = decodeURIComponent(gameId);
    
    // Show loading status
    document.getElementById('game-title').textContent = `Loading: ${decodedGameId}...`;
    
    console.log(`Attempting to load game: "${decodedGameId}" (${gameId})`);
    
    // Try to load games directly first
    Promise.all([
        fetchAndParseGameFile('distributiongames.json'),
        fetchAndParseGameFile('additionalgames.json')
    ])
    .then(([distributionGames, additionalGames]) => {
        // Combine all games into a single array
        const allGames = [...(distributionGames || []), ...(additionalGames || [])];
        console.log(`Total games found: ${allGames.length}`);
        
        // Try to find the game by title
        let game = findGameByTitle(allGames, decodedGameId, gameId);
        
        if (game) {
            console.log(`Found game: ${game.title}`);
            gameData = game;
            updatePlayer(game);
        } else {
            throw new Error(`Game "${decodedGameId}" not found in any game files`);
        }
    })
    .catch(error => {
        console.error('Error loading game data:', error);
        showError(`Failed to load game data: ${error.message}`);
    });
}

// Helper function to fetch and parse a game file
function fetchAndParseGameFile(fileName) {
    // Create a more robust URL that works in all environments
    const baseUrl = new URL(fileName, window.location.href).href;
    console.log(`Player: Attempting to fetch from: ${baseUrl} (original: ${fileName})`);
    
    return fetch(baseUrl)
        .then(response => {
            if (!response.ok) {
                console.warn(`Error loading from ${baseUrl}: ${response.status}`);
                return null;
            }
            return response.text();
        })
        .then(text => {
            if (!text) return null;
            
            try {
                // Parse the JSON
                const data = JSON.parse(text);
                console.log(`Successfully parsed ${baseUrl}`);
                
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
                
                console.log(`Extracted ${games.length} games from ${baseUrl}`);
                return games;
            } catch (error) {
                console.error(`Error parsing ${baseUrl}:`, error);
                return null;
            }
        })
        .catch(error => {
            console.error(`Error processing ${baseUrl}:`, error);
            return null;
        });
}

// Helper function to find a game by title
function findGameByTitle(games, decodedGameId, encodedGameId) {
    if (!games || games.length === 0) return null;
    
    // First try exact match
    let game = games.find(g => 
        g && g.title && (
            g.title === decodedGameId || 
            encodeURIComponent(g.title) === encodedGameId
        )
    );
    
    // If exact match fails, try case-insensitive comparison
    if (!game) {
        game = games.find(g => 
            g && g.title && (
                g.title.toLowerCase() === decodedGameId.toLowerCase() || 
                encodeURIComponent(g.title.toLowerCase()) === encodedGameId.toLowerCase()
            )
        );
    }
    
    return game;
}

function updatePlayer(game) {
    // Update title
    document.title = `${game.title} - Utilix Games`;
    gameTitle.textContent = game.title;
    
    // Update categories
    if (game.categoryList && game.categoryList.length > 0) {
        gameCategories.innerHTML = '';
        game.categoryList.forEach(category => {
            const categorySpan = document.createElement('span');
            categorySpan.className = 'category';
            categorySpan.textContent = category.name;
            gameCategories.appendChild(categorySpan);
        });
    } else {
        gameCategories.innerHTML = '<span class="category">Miscellaneous</span>';
    }
    
    // Update description
    if (game.description) {
        gameDescription.innerHTML = `<p>${game.description}</p>`;
    } else {
        gameDescription.innerHTML = '<p>No description available for this game.</p>';
    }
    
    // Update instructions
    if (game.instructions) {
        gameInstructions.innerHTML = `<p>${game.instructions}</p>`;
    } else {
        gameInstructions.innerHTML = '<p>No specific instructions provided. Use standard game controls.</p>';
    }
    
    // Setup share links
    const shareUrl = window.location.href;
    shareLinkInput.value = shareUrl;
    modalShareLinkInput.value = shareUrl;
    
    // Load game in canvas or iframe
    loadGame(game);
}

function loadGame(game) {
    // Hide loading indicator when game is loaded
    setTimeout(() => {
        loadingIndicator.style.display = 'none';
    }, 1500);
    
    // Clear previous content
    gameFrameContainer.innerHTML = '';
    
    if (game.url) {
        // If game has a direct URL, create an iframe
        const iframe = document.createElement('iframe');
        iframe.src = game.url;
        iframe.allowFullscreen = true;
        iframe.allow = 'autoplay; fullscreen';
        iframe.style.width = '100%';
        iframe.style.height = '100%';
        iframe.style.border = 'none';
        
        // Add iframe to container
        gameFrameContainer.appendChild(iframe);
        
        // Start loading game
        iframe.addEventListener('load', () => {
            loadingIndicator.style.display = 'none';
        });
        
        iframe.addEventListener('error', () => {
            showError('Failed to load the game. Please try again later.');
        });
    } else if (game.assetList && game.assetList.length > 0) {
        // For canvas games, we would initialize the canvas here
        initCanvas(game);
    } else {
        showError('This game does not have valid content to display.');
    }
}

function initCanvas(game) {
    // Canvas initialization would depend on the specific game
    // This is a placeholder function that would be customized per game
    const ctx = gameCanvas.getContext('2d');
    
    // Set canvas dimensions
    gameCanvas.width = gameFrameContainer.clientWidth;
    gameCanvas.height = gameFrameContainer.clientHeight;
    
    // Example: Draw a placeholder
    ctx.fillStyle = '#0e0e10';
    ctx.fillRect(0, 0, gameCanvas.width, gameCanvas.height);
    
    ctx.font = '24px var(--font-primary)';
    ctx.fillStyle = '#efeff1';
    ctx.textAlign = 'center';
    ctx.fillText(game.title, gameCanvas.width / 2, gameCanvas.height / 2 - 15);
    
    ctx.font = '16px var(--font-primary)';
    ctx.fillStyle = '#9147ff';
    ctx.fillText('Game is loading...', gameCanvas.width / 2, gameCanvas.height / 2 + 15);
    
    // After canvas is initialized, hide loading
    setTimeout(() => {
        loadingIndicator.style.display = 'none';
    }, 1000);
}

function toggleTheaterMode() {
    isTheaterMode = !isTheaterMode;
    document.body.classList.toggle('theater-mode', isTheaterMode);
    playerHeader.classList.toggle('theater-mode', isTheaterMode);
    
    // Update icon
    theaterModeBtn.innerHTML = isTheaterMode ? 
        '<i class="fas fa-compress-alt"></i>' : 
        '<i class="fas fa-film"></i>';
    
    // Resize canvas if using canvas
    if (gameCanvas) {
        gameCanvas.width = gameFrameContainer.clientWidth;
        gameCanvas.height = gameFrameContainer.clientHeight;
    }
}

function toggleFullscreen() {
    isFullscreen = !isFullscreen;
    
    // Set the UI state
    updateFullscreenUI();
    
    // Request actual fullscreen if supported
    if (isFullscreen) {
        if (document.documentElement.requestFullscreen) {
            document.documentElement.requestFullscreen();
        } else if (document.documentElement.mozRequestFullScreen) {
            document.documentElement.mozRequestFullScreen();
        } else if (document.documentElement.webkitRequestFullscreen) {
            document.documentElement.webkitRequestFullscreen();
        } else if (document.documentElement.msRequestFullscreen) {
            document.documentElement.msRequestFullscreen();
        }
    } else {
        if (document.exitFullscreen) {
            document.exitFullscreen();
        } else if (document.mozCancelFullScreen) {
            document.mozCancelFullScreen();
        } else if (document.webkitExitFullscreen) {
            document.webkitExitFullscreen();
        } else if (document.msExitFullscreen) {
            document.msExitFullscreen();
        }
    }
}

// Function to update UI based on fullscreen state
function updateFullscreenUI() {
    document.body.classList.toggle('fullscreen-mode', isFullscreen);
    
    // Update icon
    fullscreenBtn.innerHTML = isFullscreen ? 
        '<i class="fas fa-compress"></i>' : 
        '<i class="fas fa-expand"></i>';
    
    // Resize canvas if using canvas
    if (gameCanvas) {
        gameCanvas.width = gameFrameContainer.clientWidth;
        gameCanvas.height = gameFrameContainer.clientHeight;
    }
}

// Handler for fullscreen change events (triggered by browser)
function handleFullscreenChange() {
    // Check if we're actually in fullscreen mode
    const isCurrentlyFullscreen = Boolean(
        document.fullscreenElement ||
        document.webkitFullscreenElement ||
        document.mozFullScreenElement ||
        document.msFullscreenElement
    );
    
    // Only update if our state doesn't match the actual state
    if (isFullscreen !== isCurrentlyFullscreen) {
        isFullscreen = isCurrentlyFullscreen;
        updateFullscreenUI();
    }
}

// Handle key presses
function handleKeyPress(e) {
    // Check for Escape key (keyCode 27)
    if (e.key === 'Escape' || e.keyCode === 27) {
        // If we think we're in fullscreen but the browser isn't, update our state
        const isCurrentlyFullscreen = Boolean(
            document.fullscreenElement ||
            document.webkitFullscreenElement ||
            document.mozFullScreenElement ||
            document.msFullscreenElement
        );
        
        if (!isCurrentlyFullscreen && isFullscreen) {
            isFullscreen = false;
            updateFullscreenUI();
        }
    }
}

function openShareModal() {
    shareModal.classList.add('show');
}

function closeShareModal() {
    shareModal.classList.remove('show');
}

function copyShareLink() {
    const linkInput = this.id.includes('modal') ? modalShareLinkInput : shareLinkInput;
    linkInput.select();
    document.execCommand('copy');
    
    // Visual feedback
    this.innerHTML = '<i class="fas fa-check"></i>';
    setTimeout(() => {
        this.innerHTML = '<i class="fas fa-copy"></i>';
    }, 2000);
}

function shareFacebook() {
    const shareUrl = encodeURIComponent(window.location.href);
    const title = encodeURIComponent(gameData?.title || 'Awesome Game');
    window.open(`https://www.facebook.com/sharer/sharer.php?u=${shareUrl}&t=${title}`, '_blank');
}

function shareTwitter() {
    const shareUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this awesome game: ${gameData?.title || 'Awesome Game'}`);
    window.open(`https://twitter.com/intent/tweet?url=${shareUrl}&text=${text}`, '_blank');
}

function shareWhatsapp() {
    const shareUrl = encodeURIComponent(window.location.href);
    const text = encodeURIComponent(`Check out this awesome game: ${gameData?.title || 'Awesome Game'} ${window.location.href}`);
    window.open(`https://wa.me/?text=${text}`, '_blank');
}

function showError(message) {
    // Update the page title to show there's an error
    document.title = 'Game Not Found - Utilix Games';
    
    // Update the game title
    if (gameTitle) {
        gameTitle.textContent = 'Game Not Found';
    }
    
    // Hide loading indicator
    if (loadingIndicator) {
        loadingIndicator.style.display = 'none';
    }
    
    // Clear the game frame container
    if (gameFrameContainer) {
        gameFrameContainer.innerHTML = '';
        
        // Create an error message container
        const errorContainer = document.createElement('div');
        errorContainer.className = 'error-container';
        errorContainer.innerHTML = `
            <div class="error-icon">
                <i class="fas fa-exclamation-circle"></i>
            </div>
            <h2>Game Loading Error</h2>
            <p>${message}</p>
            <div class="error-actions">
                <button id="retry-button" class="retry-btn">
                    <i class="fas fa-sync-alt"></i> Retry Loading
                </button>
                <a href="index.html" class="back-btn">
                    <i class="fas fa-arrow-left"></i> Back to Games
                </a>
            </div>
        `;
        
        gameFrameContainer.appendChild(errorContainer);
        
        // Add event listener to the retry button
        const retryButton = document.getElementById('retry-button');
        if (retryButton) {
            retryButton.addEventListener('click', () => {
                retryLoading();
            });
        }
    }
}

// Function to retry loading the game
function retryLoading() {
    location.reload();
}

// Close modal when clicking outside
window.onclick = function(event) {
    if (event.target === shareModal) {
        closeShareModal();
    }
};

// Handle window resize
window.addEventListener('resize', function() {
    if (gameCanvas) {
        gameCanvas.width = gameFrameContainer.clientWidth;
        gameCanvas.height = gameFrameContainer.clientHeight;
    }
}); 