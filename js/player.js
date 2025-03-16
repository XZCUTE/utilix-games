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
    
    // Special case for Two Hands of Satan - handle this first
    if (decodedGameId === "Two Hands of Satan" || gameId === "Two%20Hands%20of%20Satan") {
        console.log("Game matched Two Hands of Satan, loading manually");
        loadTwoHandsOfSatan();
        return;
    }
    
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
            // Special case handling for specific games
            if (decodedGameId === "Revenge and Justice" || gameId === "Revenge%20and%20Justice") {
                console.log("Game not found in data, loading Revenge and Justice manually");
                loadRevengeAndJustice();
            } else if (decodedGameId === "Axe of the Ancients: Dwarven Fury" || gameId === "Axe%20of%20the%20Ancients%3A%20Dwarven%20Fury") {
                console.log("Game not found in data, loading Axe of the Ancients manually");
                loadAxeOfTheAncients();
            } else if (decodedGameId === "Two Hands of Satan" || gameId === "Two%20Hands%20of%20Satan") {
                console.log("Game not found in data, loading Two Hands of Satan manually");
                loadTwoHandsOfSatan();
            } else {
                throw new Error(`Game "${decodedGameId}" not found in any game files`);
            }
        }
    })
    .catch(error => {
        console.error('Error loading game data:', error);
        showError(`Failed to load game data: ${error.message}`);
    });
}

// Helper function to fetch and parse a game file
function fetchAndParseGameFile(fileName) {
    return fetch(fileName)
        .then(response => {
            if (!response.ok) {
                console.warn(`Error loading from ${fileName}: ${response.status}`);
                return null;
            }
            return response.text();
        })
        .then(text => {
            if (!text) return null;
            
            try {
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
                
                console.log(`Extracted ${games.length} games from ${fileName}`);
                return games;
            } catch (error) {
                console.error(`Error parsing ${fileName}:`, error);
                return null;
            }
        })
        .catch(error => {
            console.error(`Error processing ${fileName}:`, error);
            return null;
        });
}

// Helper function to find a game by title
function findGameByTitle(games, decodedGameId, encodedGameId) {
    if (!games || games.length === 0) return null;
    
    // First try exact match with proper decoding of both sides
    let game = games.find(g => 
        g && g.title && (
            g.title === decodedGameId || 
            encodeURIComponent(g.title) === encodedGameId ||
            // Additional matching attempts for better detection
            decodeURIComponent(g.title) === decodedGameId ||
            g.title === decodeURIComponent(encodedGameId)
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
    
    // Try to automatically load specific games if that was the game being loaded
    const urlParams = new URLSearchParams(window.location.search);
    const gameId = urlParams.get('id');
    const decodedGameId = gameId ? decodeURIComponent(gameId) : '';
    
    if (decodedGameId === "Revenge and Justice" || gameId === "Revenge%20and%20Justice") {
        console.log("Detected Revenge and Justice game in error handler, attempting automatic recovery");
        loadRevengeAndJustice();
    } else if (decodedGameId === "Axe of the Ancients: Dwarven Fury" || gameId === "Axe%20of%20the%20Ancients%3A%20Dwarven%20Fury") {
        console.log("Detected Axe of the Ancients: Dwarven Fury game in error handler, attempting automatic recovery");
        loadAxeOfTheAncients();
    }
}

// Function to load Revenge and Justice game directly
function loadRevengeAndJustice() {
    const gameData = {
        title: "Revenge and Justice",
        description: "Revenge and Justice is a gripping tale of vengeance, survival, and redemption in a world ravaged by destruction. Step into the role of a lone survivor seeking justice against those who destroyed everything.",
        url: "https://html5.gamedistribution.com/ded5788b27ca45c9b0934c2186de9749/?gd_sdk_referrer_url=https://gamedistribution.com/games/revenge-and-justice",
        instructions: "Mouse - Shooting, WASD keys - Move, Spacebar - Jump, SHIFT - Run, R - Reload, Q - Roll, P - Pause",
        categoryList: [
            {name: "Action Games"},
            {name: "Shooting Games"},
            {name: "Adventure Games"}
        ]
    };
    
    // Fix the header title first
    document.title = `${gameData.title} - Utilix Games`;
    if (gameTitle) {
        gameTitle.textContent = gameData.title;
    }
    
    // Update the player with the manually loaded game data
    updatePlayer(gameData);
}

// Function to load Axe of the Ancients: Dwarven Fury game directly
function loadAxeOfTheAncients() {
    const gameData = {
        title: "Axe of the Ancients: Dwarven Fury",
        description: "Axe of the Ancients: Dwarven Fury is an epic action hack-and-slash adventure, blending stunning visuals with classic gameplay inspired by Warcraft and Golden Axe. Step into the boots of Thorgar, a mighty dwarven warrior on a quest for revenge.",
        url: "https://html5.gamedistribution.com/c3238ecc4c3f4550a8f9fc9599cbc189/?gd_sdk_referrer_url=https://gamedistribution.com/games/axe-of-the-ancients-dwarven-fury",
        instructions: "Left mouse button - Attack, Right mouse button - Lock on enemy, WASD keys - Move, Spacebar - Jump, SHIFT - Run, E - Strong attack, Q - Roll, P - Pause",
        categoryList: [
            {name: "Action Games"},
            {name: "3D Games"},
            {name: "Adventure Games"},
            {name: "Fighting Games"},
            {name: "HTML5 games"},
            {name: "WebGL Games"}
        ]
    };
    
    // Fix the header title first
    document.title = `${gameData.title} - Utilix Games`;
    if (gameTitle) {
        gameTitle.textContent = gameData.title;
    }
    
    // Update the player with the manually loaded game data
    updatePlayer(gameData);
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

// Add a function to handle "Two Hands of Satan" game specifically
function loadTwoHandsOfSatan() {
    const game = {
        title: "Two Hands of Satan",
        description: "Two Hands of Satan is a thrilling multiplayer first-person shooter that plunges players into intense, chaotic battles. This free-to-play game is designed to captivate with fast-paced, competitive gameplay, setting it apart in the shooter genre.",
        url: "https://html5.gamedistribution.com/f804d079d19d413b9871274d4ed72e4c/?gd_sdk_referrer_url=https://gamedistribution.com/games/two-hands-of-satan",
        instructions: "Mouse - Shooting, WASD keys - Movement, Spacebar - Jump, SHIFT - Sprint, 1 || 4 - Change weapon, H - Medkit, T - Chat, C - Crouch, TAB - Score, ESC - Pause",
        categoryList: [
            {name: "Action Games"},
            {name: "3D Games"},
            {name: "Multiplayer Games"},
            {name: "Shooting Games"},
            {name: "HTML5 games"},
            {name: "WebGL Games"}
        ]
    };
    
    console.log("Manually loading Two Hands of Satan game");
    gameData = game;
    updatePlayer(game);
    
    // Set the title and header after updating the player
    document.title = `Playing: ${game.title} | Utilix Games`;
    const gameTitle = document.getElementById('game-title');
    if (gameTitle) gameTitle.textContent = game.title;
} 