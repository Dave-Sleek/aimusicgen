// Initialize with your API key
const audioProcessor = new AudioProcessor('your-api-key-here');

// Update the generateMusic function
async function generateMusic() {
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    try {
        const duration = document.getElementById('length-slider').value;
        const musicParams = {
            genre: appState.selectedGenre,
            duration: parseInt(duration),
            ...appState.moodSettings
        };
        
        // Generate with real API
        await audioProcessor.generateMusic(musicParams);
        
        // Initialize visualizer with real audio
        initVisualizer(audioProcessor.audioBuffer);
        
        // Enable playback controls
        document.getElementById('play-btn').disabled = false;
        document.getElementById('download-btn').disabled = false;
        
    } catch (error) {
        console.error('Error generating music:', error);
        alert(`Failed to generate music: ${error.message}`);
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Music';
    }
}

// Update playback controls
function playAudio() {
    audioProcessor.play();
}

function pauseAudio() {
    audioProcessor.pause();
}

// Update download function
async function downloadAudio() {
    try {
        const download = await audioProcessor.createDownloadLink(`neon-beats-${appState.selectedGenre}`);
        if (!download) return;
        
        const a = document.createElement('a');
        a.href = download.url;
        a.download = download.filename;
        document.body.appendChild(a);
        a.click();
        
        // Clean up
        setTimeout(() => {
            document.body.removeChild(a);
            download.cleanup();
        }, 100);
    } catch (error) {
        console.error('Error downloading audio:', error);
        alert('Failed to download audio');
    }
}

function setupEventListeners() {
    // ... existing event listeners ...
    
    // Audio processor events
    audioProcessor.on('generationStarted', () => {
        showLoadingState(true);
    });
    
    audioProcessor.on('generationComplete', () => {
        showLoadingState(false);
        showNotification('Music generated successfully!', 'success');
    });
    
    audioProcessor.on('generationFailed', (event) => {
        showLoadingState(false);
        showNotification(`Generation failed: ${event.detail.error.message}`, 'error');
    });
    
    audioProcessor.on('playbackStarted', () => {
        updatePlaybackControls(true);
    });
    
    audioProcessor.on('playbackPaused', () => {
        updatePlaybackControls(false);
    });
    
    audioProcessor.on('playbackEnded', () => {
        updatePlaybackControls(false);
    });
}

function showLoadingState(show) {
    const visualizer = document.getElementById('visualizer');
    const ctx = visualizer.getContext('2d');
    
    if (show) {
        visualizer.style.background = 'rgba(0, 0, 0, 0.5)';
        ctx.fillStyle = 'white';
        ctx.font = '20px Arial';
        ctx.textAlign = 'center';
        ctx.fillText('Generating your music...', visualizer.width/2, visualizer.height/2);
    } else {
        visualizer.style.background = '';
        ctx.clearRect(0, 0, visualizer.width, visualizer.height);
    }
}

function showNotification(message, type) {
    const notification = document.createElement('div');
    notification.className = `notification ${type}`;
    notification.textContent = message;
    
    document.body.appendChild(notification);
    
    setTimeout(() => {
        notification.classList.add('fade-out');
        setTimeout(() => {
            document.body.removeChild(notification);
        }, 500);
    }, 3000);
}


