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
    
    // First try to load from distributiongames.json
    loadGameFromFile(decodedGameId, gameId, 'distributiongames.json')
        .then(game => {
            if (game) {
                gameData = game;
                updatePlayer(game);
            } else {
                // If not found, try to load from additionalgames.json
                return loadGameFromFile(decodedGameId, gameId, 'additionalgames.json');
            }
        })
        .then(game => {
            if (game) {
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

function loadGameFromFile(decodedGameId, encodedGameId, fileName) {
    return fetch(fileName)
        .then(response => {
            if (!response.ok) {
                console.warn(`Error loading from ${fileName}: ${response.status}`);
                return null; // Return null to indicate file not found or error
            }
            return response.text();
        })
        .then(text => {
            if (!text) return null;
            
            let data;
            try {
                // Try to parse as regular JSON first
                data = JSON.parse(text);
            } catch (error) {
                console.warn(`Could not parse ${fileName} directly, trying alternative method`, error);
                
                // If the JSON is invalid or in an unusual format, try to extract the games
                try {
                    // Attempt to manually create the structure
                    const processedText = `{"games":[${text}]}`;
                    data = JSON.parse(processedText);
                } catch (innerError) {
                    console.error(`Failed to parse ${fileName} using alternative method`, innerError);
                    return null;
                }
            }
            
            // Extract games from the data structure
            let games;
            if (data && Array.isArray(data.games)) {
                games = data.games.map(item => item.game || item);
            } else if (data && Array.isArray(data)) {
                games = data.map(item => item.game || item);
            } else {
                console.warn(`${fileName} format unexpected, attempting direct use`, data);
                games = Array.isArray(data) ? data : [data];
            }
            
            if (games.length === 0) {
                return null;
            }
            
            // Find game by title using case-insensitive comparison
            const game = games.find(g => 
                g.title && 
                (g.title.toLowerCase() === decodedGameId.toLowerCase() || 
                 encodeURIComponent(g.title) === encodedGameId)
            );
            
            return game || null;
        })
        .catch(error => {
            console.error(`Error processing ${fileName}:`, error);
            return null;
        });
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