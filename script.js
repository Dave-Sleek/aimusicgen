
// Main application logic
document.addEventListener('DOMContentLoaded', () => {
    // Initialize the app
    initGenreButtons();
    initMoodSliders();
    setupEventListeners();
    
    // Check for previous sessions
    loadHistory();
});

// Configuration
const genres = [
    { id: 'electronic', name: 'Electronic', icon: '🎛️' },
    { id: 'ambient', name: 'Ambient', icon: '🌌' },
    { id: 'rock', name: 'Rock', icon: '🎸' },
    { id: 'hiphop', name: 'Hip Hop', icon: '🎤' },
    { id: 'classical', name: 'Classical', icon: '🎻' },
    { id: 'jazz', name: 'Jazz', icon: '🎷' },
    { id: 'lofi', name: 'Lo-Fi', icon: '☕' },
    { id: 'synthwave', name: 'Synthwave', icon: '🌃' }
];

const moodParams = [
    { id: 'energy', name: 'Energy', min: 0, max: 100, value: 50 },
    { id: 'happiness', name: 'Happiness', min: 0, max: 100, value: 50 },
    { id: 'danceability', name: 'Danceability', min: 0, max: 100, value: 50 },
    { id: 'complexity', name: 'Complexity', min: 0, max: 100, value: 50 }
];

// State management
let appState = {
    selectedGenre: 'electronic',
    moodSettings: {},
    audioContext: null,
    audioBuffer: null,
    isPlaying: false,
    history: []
};

// Initialize genre selection buttons
function initGenreButtons() {
    const container = document.querySelector('.genre-buttons');
    
    genres.forEach(genre => {
        const button = document.createElement('button');
        button.className = 'genre-btn';
        if (genre.id === appState.selectedGenre) button.classList.add('active');
        button.innerHTML = `${genre.icon} ${genre.name}`;
        button.dataset.genre = genre.id;
        
        button.addEventListener('click', () => {
            document.querySelectorAll('.genre-btn').forEach(btn => btn.classList.remove('active'));
            button.classList.add('active');
            appState.selectedGenre = genre.id;
        });
        
        container.appendChild(button);
    });
}

// Initialize mood sliders
function initMoodSliders() {
    const container = document.querySelector('.sliders-container');
    
    moodParams.forEach(param => {
        appState.moodSettings[param.id] = param.value;
        
        const sliderGroup = document.createElement('div');
        sliderGroup.className = 'slider-group';
        
        const label = document.createElement('label');
        label.textContent = param.name;
        label.htmlFor = `${param.id}-slider`;
        
        const slider = document.createElement('input');
        slider.type = 'range';
        slider.id = `${param.id}-slider`;
        slider.min = param.min;
        slider.max = param.max;
        slider.value = param.value;
        
        const valueDisplay = document.createElement('span');
        valueDisplay.className = 'slider-value';
        valueDisplay.textContent = param.value;
        
        slider.addEventListener('input', () => {
            const value = parseInt(slider.value);
            valueDisplay.textContent = value;
            appState.moodSettings[param.id] = value;
        });
        
        sliderGroup.appendChild(label);
        sliderGroup.appendChild(slider);
        sliderGroup.appendChild(valueDisplay);
        container.appendChild(sliderGroup);
    });
}

// Set up event listeners
function setupEventListeners() {
    // Generate button
    document.getElementById('generate-btn').addEventListener('click', generateMusic);
    
    // Playback controls
    document.getElementById('play-btn').addEventListener('click', playAudio);
    document.getElementById('pause-btn').addEventListener('click', pauseAudio);
    document.getElementById('download-btn').addEventListener('click', downloadAudio);
    
    // Duration slider
    const lengthSlider = document.getElementById('length-slider');
    const lengthValue = document.getElementById('length-value');
    
    lengthSlider.addEventListener('input', () => {
        lengthValue.textContent = `${lengthSlider.value} seconds`;
    });
}

// Generate music using AI (mock implementation - would connect to real API)
async function generateMusic() {
    const generateBtn = document.getElementById('generate-btn');
    generateBtn.disabled = true;
    generateBtn.textContent = 'Generating...';
    
    // Show loading state
    const visualizer = document.getElementById('visualizer');
    visualizer.style.background = 'rgba(0, 0, 0, 0.5)';
    const ctx = visualizer.getContext('2d');
    ctx.fillStyle = 'white';
    ctx.font = '20px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('Creating your music...', visualizer.width/2, visualizer.height/2);
    
    try {
        // In a real app, this would call your AI music generation API
        // For this example, we'll simulate an API call with a timeout
        const duration = document.getElementById('length-slider').value;
        const musicParams = {
            genre: appState.selectedGenre,
            duration: parseInt(duration),
            ...appState.moodSettings
        };
        
        // Simulate API delay
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // For a real implementation, you would:
        // 1. Call your AI music generation API with musicParams
        // 2. Receive an audio file or stream
        // 3. Process it for playback
        
        // Mock response - in reality you'd get actual audio data
        const mockAudioData = simulateAudioGeneration(musicParams);
        
        // Initialize audio context if not already done
        if (!appState.audioContext) {
            appState.audioContext = new (window.AudioContext || window.webkitAudioContext)();
        }
        
        // Decode audio data (in real app, this would be the API response)
        const audioBuffer = await decodeAudioData(appState.audioContext, mockAudioData);
        appState.audioBuffer = audioBuffer;
        
        // Add to history
        const historyItem = {
            id: Date.now(),
            params: musicParams,
            timestamp: new Date().toISOString()
        };
        appState.history.unshift(historyItem);
        saveHistory();
        updateHistoryDisplay();
        
        // Initialize visualizer
        initVisualizer(audioBuffer);
        
        // Enable playback
        document.getElementById('play-btn').disabled = false;
        document.getElementById('download-btn').disabled = false;
        
    } catch (error) {
        console.error('Error generating music:', error);
        alert('Failed to generate music. Please try again.');
    } finally {
        generateBtn.disabled = false;
        generateBtn.textContent = 'Generate Music';
    }
}

// Simulate audio generation (mock function)
function simulateAudioGeneration(params) {
    // In a real app, this would be handled by your backend/AI service
    console.log('Generating music with params:', params);
    
    // Return mock audio data - in reality this would be actual audio data from your API
    return {
        sampleRate: 44100,
        duration: params.duration,
        // ... other mock audio properties
    };
}

// Audio playback functions
function playAudio() {
    if (!appState.audioBuffer || appState.isPlaying) return;
    
    const source = appState.audioContext.createBufferSource();
    source.buffer = appState.audioBuffer;
    source.connect(appState.audioContext.destination);
    source.start();
    
    appState.isPlaying = true;
    document.getElementById('play-btn').disabled = true;
    document.getElementById('pause-btn').disabled = false;
    
    source.onended = () => {
        appState.isPlaying = false;
        document.getElementById('play-btn').disabled = false;
        document.getElementById('pause-btn').disabled = true;
    };
}

function pauseAudio() {
    // Note: Web Audio API doesn't have native pause/resume
    // In a real implementation, you'd need to track playback time
    // and implement pause/resume functionality
    
    appState.isPlaying = false;
    // This is simplified - actual implementation would be more complex
    document.getElementById('play-btn').disabled = false;
    document.getElementById('pause-btn').disabled = true;
}

function downloadAudio() {
    if (!appState.audioBuffer) return;
    
    // In a real app, you would:
    // 1. Export the audio buffer to a file (WAV/MP3)
    // 2. Create a download link
    // This is a mock implementation
    
    const a = document.createElement('a');
    a.href = '#';
    a.download = `neon-beats-${new Date().toISOString()}.wav`;
    a.click();
    
    alert('In a real implementation, this would download your generated audio file.');
}

// History management
function saveHistory() {
    localStorage.setItem('neonBeatsHistory', JSON.stringify(appState.history));
}

function loadHistory() {
    const savedHistory = localStorage.getItem('neonBeatsHistory');
    if (savedHistory) {
        appState.history = JSON.parse(savedHistory);
        updateHistoryDisplay();
    }
}

function updateHistoryDisplay() {
    const container = document.querySelector('.history-grid');
    container.innerHTML = '';
    
    appState.history.slice(0, 6).forEach(item => {
        const historyItem = document.createElement('div');
        historyItem.className = 'history-item';
        
        const genre = genres.find(g => g.id === item.params.genre) || {};
        
        historyItem.innerHTML = `
            <h4>${genre.icon || ''} ${genre.name || item.params.genre}</h4>
            <p>${new Date(item.timestamp).toLocaleString()}</p>
            <p>${item.params.duration}s</p>
        `;
        
        historyItem.addEventListener('click', () => {
            // Load this history item's parameters
            loadHistoryItem(item);
        });
        
        container.appendChild(historyItem);
    });
}

function loadHistoryItem(item) {
    // Set genre
    document.querySelector(`.genre-btn[data-genre="${item.params.genre}"]`).click();
    
    // Set mood sliders
    for (const [key, value] of Object.entries(item.params)) {
        if (key !== 'genre' && key !== 'duration') {
            const slider = document.getElementById(`${key}-slider`);
            if (slider) {
                slider.value = value;
                slider.dispatchEvent(new Event('input'));
            }
        }
    }
    
    // Set duration
    document.getElementById('length-slider').value = item.params.duration;
    document.getElementById('length-value').textContent = `${item.params.duration} seconds`;
}

// Audio processing helper
function decodeAudioData(audioContext, audioData) {
    // In a real app, this would decode actual audio data from your API
    // This is a mock implementation that creates a silent buffer
    
    return new Promise((resolve) => {
        const sampleRate = audioData.sampleRate || 44100;
        const duration = audioData.duration || 30;
        const numChannels = 2;
        const frameCount = sampleRate * duration;
        
        const buffer = audioContext.createBuffer(
            numChannels,
            frameCount,
            sampleRate
        );
        
        // Fill buffer with mock data (silence in this case)
        for (let channel = 0; channel < numChannels; channel++) {
            const channelData = buffer.getChannelData(channel);
            for (let i = 0; i < frameCount; i++) {
                // Generate some simple waveform for demo purposes
                channelData[i] = Math.sin(i / 20) * 0.1;
            }
        }
        
        resolve(buffer);
    });
}

// Initialize audio visualizer
function initVisualizer(audioBuffer) {
    const canvas = document.getElementById('visualizer');
    const ctx = canvas.getContext('2d');
    
    // Set canvas dimensions
    canvas.width = canvas.offsetWidth;
    canvas.height = canvas.offsetHeight;
    
    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    
    // Draw waveform
    const channelData = audioBuffer.getChannelData(0);
    const step = Math.ceil(channelData.length / canvas.width);
    const amp = canvas.height / 2;
    
    ctx.beginPath();
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.8)';
    ctx.lineWidth = 2;
    
    for (let i = 0; i < canvas.width; i++) {
        const min = 1.0;
        const max = -1.0;
        
        for (let j = 0; j < step; j++) {
            const datum = channelData[(i * step) + j];
            if (datum < min) min = datum;
            if (datum > max) max = datum;
        }
        
        ctx.moveTo(i, (1 + min) * amp);
        ctx.lineTo(i, (1 + max) * amp);
    }
    
    ctx.stroke();
}
