// Global variables
let gameData = null;
let gameContainer = null;
let gameCanvas = null;
let isTheaterMode = false;
let isFullscreen = false;
const gamesJsonUrl = 'distributiongames.json';

// DOM Elements
const gameTitle = document.getElementById('game-title');
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
async function initPlayer() {
    // Get DOM elements
    gameContainer = document.getElementById('game-container');
    gameCanvas = document.getElementById('game-canvas');
    
    // Get game ID from URL
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    
    if (!gameId) {
        showError('No game ID specified');
        return;
    }
    
    // Show loading status
    document.getElementById('game-title').textContent = `Loading: ${gameId}...`;
    
    try {
        // Load game data
        gameData = await loadGameData(gameId);
        
        // Update player with game data
        updatePlayer(gameData);
    } catch (error) {
        console.error('Error initializing player:', error);
    }
    
    // Add event listeners
    document.getElementById('back-btn').addEventListener('click', goBack);
    document.getElementById('fullscreen-btn').addEventListener('click', toggleFullscreen);
    
    // Add ESC key handler for exiting fullscreen
    document.addEventListener('keydown', handleKeyPress);
    
    // Hide loader after 1.5 seconds for better UX
    setTimeout(() => {
        document.querySelector('.loader-container').style.display = 'none';
    }, 1500);
}

// Load game data from JSON files
async function loadGameData(gameId) {
    try {
        // Try to load from main games file first
        const mainGamesResponse = await fetch('./distributiongames.json');
        if (!mainGamesResponse.ok) {
            throw new Error(`HTTP error! status: ${mainGamesResponse.status}`);
        }
        
        const mainGamesText = await mainGamesResponse.text();
        const mainGames = parseGamesData(mainGamesText);
        
        // Find the game in main games
        let game = mainGames.find(g => g.title === gameId);
        
        // If not found in main games, try additional games
        if (!game) {
            try {
                const additionalGamesResponse = await fetch('./additionalgames.json');
                if (additionalGamesResponse.ok) {
                    const additionalGamesText = await additionalGamesResponse.text();
                    const additionalGames = parseGamesData(additionalGamesText);
                    game = additionalGames.find(g => g.title === gameId);
                }
            } catch (error) {
                console.warn('Error loading additional games:', error);
            }
        }
        
        if (game) {
            return game;
        } else {
            throw new Error(`Game "${gameId}" not found`);
        }
    } catch (error) {
        console.error('Error loading game data:', error);
        showError(`Failed to load game: ${error.message}`);
        throw error;
    }
}

function parseGamesData(text) {
    let data;
    try {
        // Try to parse as regular JSON first
        data = JSON.parse(text);
    } catch (error) {
        console.warn(`Could not parse directly, trying alternative method`, error);
        
        // If the JSON is invalid or in an unusual format, try to extract the games
        try {
            // Attempt to manually create the structure
            const processedText = `{"games":[${text}]}`;
            data = JSON.parse(processedText);
        } catch (innerError) {
            console.error(`Failed to parse using alternative method`, innerError);
            return [];
        }
    }
    
    // Extract games from the data structure
    let games;
    if (data && Array.isArray(data.games)) {
        games = data.games.map(item => item.game || item);
    } else if (data && Array.isArray(data)) {
        games = data.map(item => item.game || item);
    } else {
        console.warn(`format unexpected, attempting direct use`, data);
        games = Array.isArray(data) ? data : [data];
    }
    
    return games;
}

function updatePlayer(game) {
    // Update title
    document.title = `${game.title} - Utilix Games`;
    document.getElementById('game-title').textContent = game.title;
    
    // Update categories
    if (gameCategories) {
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
    }
    
    // Update description
    if (gameDescription) {
        if (game.description) {
            gameDescription.innerHTML = `<p>${game.description}</p>`;
        } else {
            gameDescription.innerHTML = '<p>No description available for this game.</p>';
        }
    }
    
    // Update instructions
    if (gameInstructions) {
        if (game.instructions) {
            gameInstructions.innerHTML = `<p>${game.instructions}</p>`;
        } else {
            gameInstructions.innerHTML = '<p>No specific instructions provided. Use standard game controls.</p>';
        }
    }
    
    // Setup share links
    if (shareLinkInput) shareLinkInput.value = window.location.href;
    if (modalShareLinkInput) modalShareLinkInput.value = window.location.href;
    
    // Load game in iframe
    loadGame(game);
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
    // Hide any loading elements
    if (document.querySelector('.loader-container')) {
        document.querySelector('.loader-container').style.display = 'none';
    }
    
    // Create more visually appealing error display
    loadingIndicator.innerHTML = `
        <div style="background-color: var(--card-bg); padding: 30px; border-radius: 12px; text-align: center; max-width: 500px; border: 1px solid var(--border-color);">
            <i class="fas fa-exclamation-circle" style="font-size: 50px; color: #ff5ebc; margin-bottom: 20px;"></i>
            <h3 style="color: var(--light-text); margin-bottom: 15px;">Game Not Found</h3>
            <p style="color: var(--text-color); margin-bottom: 25px;">${message}</p>
            <div style="display: flex; justify-content: center; gap: 15px;">
                <a href="index.html" class="btn" style="background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));">
                    <i class="fas fa-arrow-left"></i> Back to Games
                </a>
                <button onclick="retryLoading()" class="btn" style="background: rgba(145, 71, 255, 0.2); color: var(--primary-light);">
                    <i class="fas fa-sync-alt"></i> Retry
                </button>
            </div>
        </div>
    `;
    loadingIndicator.style.display = 'flex';
    
    // Update title to reflect error
    document.title = 'Game Not Found - Utilix Games';
    if (gameTitle) {
        gameTitle.textContent = 'Game Not Found';
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

// Load the game in an iframe
function loadGame(game) {
    // Get loading indicator
    const loadingIndicator = document.getElementById('loading-indicator');
    
    // Hide loading indicator when game is loaded
    setTimeout(() => {
        if (loadingIndicator) loadingIndicator.style.display = 'none';
    }, 1500);
    
    // Clear previous content
    gameContainer.innerHTML = '';
    
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
        gameContainer.appendChild(iframe);
        
        // Start loading game
        iframe.addEventListener('load', () => {
            if (loadingIndicator) loadingIndicator.style.display = 'none';
        });
        
        iframe.addEventListener('error', () => {
            showError('Failed to load the game. Please try again later.');
        });
    } else if (game.assetList && game.assetList.length > 0) {
        // If the game has assets, use those
        const gameAsset = game.assetList.find(asset => asset.type === 'game' || asset.type === 'main');
        
        if (gameAsset && gameAsset.url) {
            // If the asset has a URL, use an iframe
            const iframe = document.createElement('iframe');
            iframe.src = gameAsset.url;
            iframe.allowFullscreen = true;
            iframe.allow = 'autoplay; fullscreen';
            iframe.style.width = '100%';
            iframe.style.height = '100%';
            iframe.style.border = 'none';
            
            // Add iframe to container
            gameContainer.appendChild(iframe);
            
            // Start loading game
            iframe.addEventListener('load', () => {
                if (loadingIndicator) loadingIndicator.style.display = 'none';
            });
            
            iframe.addEventListener('error', () => {
                showError('Failed to load the game. Please try again later.');
            });
        } else {
            // Otherwise, show an error
            showError('Game assets not found or not supported');
        }
    } else {
        // If no URL or assets, show an error
        showError('Game source not found');
    }
}

// Go back to the games list
function goBack() {
    window.location.href = 'index.html';
} 