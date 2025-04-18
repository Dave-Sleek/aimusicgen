// AudioProcessor - Handles all audio-related functionality
class AudioProcessor {
    constructor() {
        this.audioContext = null;
        this.audioBuffer = null;
        this.sourceNode = null;
        this.analyserNode = null;
        this.gainNode = null;
        this.isPlaying = false;
        this.startTime = 0;
        this.pauseTime = 0;
        this.playbackRate = 1.0;
        this.history = [];
        this.MAX_HISTORY = 10;
    }

    // Initialize the audio context
    init() {
        if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            this.createAudioNodes();
        }
    }

    // Create necessary audio nodes
    createAudioNodes() {
        this.analyserNode = this.audioContext.createAnalyser();
        this.analyserNode.fftSize = 2048;
        
        this.gainNode = this.audioContext.createGain();
        this.gainNode.gain.value = 0.8;
        
        // Connect nodes: source -> analyser -> gain -> destination
        this.analyserNode.connect(this.gainNode);
        this.gainNode.connect(this.audioContext.destination);
    }

    // Load audio buffer from ArrayBuffer (would come from your AI API)
    async loadAudioFromArrayBuffer(arrayBuffer) {
        try {
            this.init();
            this.audioBuffer = await this.audioContext.decodeAudioData(arrayBuffer);
            return this.audioBuffer;
        } catch (error) {
            console.error('Error decoding audio data:', error);
            throw error;
        }
    }

    // Generate mock audio (for demo purposes - replace with actual AI API call)
    async generateMockAudio(params) {
        const duration = params.duration || 30;
        const sampleRate = 44100;
        const frameCount = sampleRate * duration;
        
        // Create offline context to generate audio
        const offlineContext = new OfflineAudioContext(2, frameCount, sampleRate);
        
        // Create simple synth for demo purposes
        const osc1 = offlineContext.createOscillator();
        const osc2 = offlineContext.createOscillator();
        const gain = offlineContext.createGain();
        
        // Configure based on genre
        this.configureSynthForGenre(osc1, osc2, gain, params.genre);
        
        // Apply mood parameters
        this.applyMoodParameters(osc1, osc2, gain, params);
        
        // Connect and start
        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(offlineContext.destination);
        
        osc1.start();
        osc2.start();
        
        // Render to buffer
        const audioBuffer = await offlineContext.startRendering();
        this.audioBuffer = audioBuffer;
        return audioBuffer;
    }

    // Configure synth based on genre (demo implementation)
    configureSynthForGenre(osc1, osc2, gain, genre) {
        switch (genre) {
            case 'electronic':
                osc1.type = 'sawtooth';
                osc1.frequency.value = 110;
                osc2.type = 'square';
                osc2.frequency.value = 220;
                gain.gain.value = 0.3;
                break;
            case 'ambient':
                osc1.type = 'sine';
                osc1.frequency.value = 55;
                osc2.type = 'sine';
                osc2.frequency.value = 110;
                gain.gain.value = 0.2;
                break;
            case 'rock':
                osc1.type = 'square';
                osc1.frequency.value = 82.41; // E
                osc2.type = 'square';
                osc2.frequency.value = 110; // A
                gain.gain.value = 0.4;
                break;
            // Add more genre configurations...
            default:
                osc1.type = 'sine';
                osc1.frequency.value = 220;
                osc2.type = 'sine';
                osc2.frequency.value = 440;
                gain.gain.value = 0.3;
        }
    }

    // Apply mood parameters to audio generation
    applyMoodParameters(osc1, osc2, gain, params) {
        // Energy affects volume and frequency modulation
        const energy = params.energy / 100;
        gain.gain.value *= energy * 1.5;
        
        // Happiness affects oscillator detuning
        const happiness = params.happiness / 100;
        const detune = (happiness - 0.5) * 100;
        osc1.detune.value = detune;
        osc2.detune.value = -detune;
        
        // Danceability affects LFO rate
        if (params.danceability > 50) {
            const lfo1 = this.audioContext.createOscillator();
            const lfoGain1 = this.audioContext.createGain();
            lfo1.frequency.value = params.danceability / 20;
            lfoGain1.gain.value = params.danceability * 2;
            lfo1.connect(lfoGain1);
            lfoGain1.connect(osc1.frequency);
            lfo1.start();
            
            const lfo2 = this.audioContext.createOscillator();
            const lfoGain2 = this.audioContext.createGain();
            lfo2.frequency.value = params.danceability / 25;
            lfoGain2.gain.value = params.danceability * 1.5;
            lfo2.connect(lfoGain2);
            lfoGain2.connect(gain.gain);
            lfo2.start();
        }
        
        // Complexity affects effects
        if (params.complexity > 60) {
            const delay = this.audioContext.createDelay();
            delay.delayTime.value = 0.3;
            const feedback = this.audioContext.createGain();
            feedback.gain.value = params.complexity / 200;
            
            gain.connect(delay);
            delay.connect(feedback);
            feedback.connect(delay);
            feedback.connect(this.audioContext.destination);
        }
    }

    // Play the loaded audio
    play() {
        if (!this.audioBuffer || this.isPlaying) return;
        
        this.init();
        
        // Create new source node
        this.sourceNode = this.audioContext.createBufferSource();
        this.sourceNode.buffer = this.audioBuffer;
        this.sourceNode.playbackRate.value = this.playbackRate;
        
        // Connect to analyser (which is connected to gain and destination)
        this.sourceNode.connect(this.analyserNode);
        
        // Handle timing (for pause/resume)
        const startOffset = this.pauseTime % this.audioBuffer.duration;
        this.startTime = this.audioContext.currentTime - startOffset;
        
        this.sourceNode.start(0, startOffset);
        this.isPlaying = true;
        
        // Handle end of playback
        this.sourceNode.onended = () => {
            this.isPlaying = false;
            this.pauseTime = 0;
            this.dispatchEvent(new CustomEvent('playbackEnded'));
        };
        
        this.dispatchEvent(new CustomEvent('playbackStarted'));
    }

    // Pause the audio
    pause() {
        if (!this.isPlaying || !this.sourceNode) return;
        
        this.pauseTime = this.audioContext.currentTime - this.startTime;
        this.sourceNode.stop();
        this.sourceNode.disconnect();
        this.sourceNode = null;
        this.isPlaying = false;
        
        this.dispatchEvent(new CustomEvent('playbackPaused'));
    }

    // Stop the audio (reset to beginning)
    stop() {
        if (this.sourceNode) {
            this.sourceNode.stop();
            this.sourceNode.disconnect();
            this.sourceNode = null;
        }
        this.isPlaying = false;
        this.pauseTime = 0;
        
        this.dispatchEvent(new CustomEvent('playbackStopped'));
    }

    // Set playback rate (0.5 = half speed, 2.0 = double speed)
    setPlaybackRate(rate) {
        this.playbackRate = Math.max(0.25, Math.min(4.0, rate));
        if (this.sourceNode) {
            this.sourceNode.playbackRate.value = this.playbackRate;
        }
    }

    // Set volume (0.0 to 1.0)
    setVolume(volume) {
        const safeVolume = Math.max(0, Math.min(1, volume));
        if (this.gainNode) {
            this.gainNode.gain.value = safeVolume;
        }
    }

    // Get current playback time in seconds
    getCurrentTime() {
        if (!this.isPlaying) return this.pauseTime;
        return this.audioContext.currentTime - this.startTime;
    }

    // Get audio duration in seconds
    getDuration() {
        return this.audioBuffer ? this.audioBuffer.duration : 0;
    }

    // Get frequency data for visualization
    getFrequencyData() {
        if (!this.analyserNode) return null;
        
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteFrequencyData(dataArray);
        
        return dataArray;
    }

    // Get waveform data for visualization
    getWaveformData() {
        if (!this.analyserNode) return null;
        
        const bufferLength = this.analyserNode.frequencyBinCount;
        const dataArray = new Uint8Array(bufferLength);
        this.analyserNode.getByteTimeDomainData(dataArray);
        
        return dataArray;
    }

    // Export audio to WAV file
    exportToWAV() {
        return new Promise((resolve) => {
            if (!this.audioBuffer) {
                resolve(null);
                return;
            }
            
            const numChannels = this.audioBuffer.numberOfChannels;
            const sampleRate = this.audioBuffer.sampleRate;
            const length = this.audioBuffer.length;
            const buffers = [];
            
            for (let channel = 0; channel < numChannels; channel++) {
                buffers.push(this.audioBuffer.getChannelData(channel));
            }
            
            const wavBuffer = this.encodeWAV(buffers, length, numChannels, sampleRate);
            resolve(wavBuffer);
        });
    }

    // Encode audio buffer to WAV format
    encodeWAV(buffers, length, numChannels, sampleRate) {
        const buffer = new ArrayBuffer(44 + length * numChannels * 2);
        const view = new DataView(buffer);
        
        // Write WAV header
        this.writeString(view, 0, 'RIFF');
        view.setUint32(4, 36 + length * numChannels * 2, true);
        this.writeString(view, 8, 'WAVE');
        this.writeString(view, 12, 'fmt ');
        view.setUint32(16, 16, true); // Subchunk1Size
        view.setUint16(20, 1, true); // PCM format
        view.setUint16(22, numChannels, true);
        view.setUint32(24, sampleRate, true);
        view.setUint32(28, sampleRate * numChannels * 2, true); // ByteRate
        view.setUint16(32, numChannels * 2, true); // BlockAlign
        view.setUint16(34, 16, true); // BitsPerSample
        this.writeString(view, 36, 'data');
        view.setUint32(40, length * numChannels * 2, true);
        
        // Write audio data
        let offset = 44;
        for (let i = 0; i < length; i++) {
            for (let channel = 0; channel < numChannels; channel++) {
                const sample = Math.max(-1, Math.min(1, buffers[channel][i]));
                view.setInt16(offset, sample < 0 ? sample * 0x8000 : sample * 0x7FFF, true);
                offset += 2;
            }
        }
        
        return buffer;
    }

    // Helper to write string to DataView
    writeString(view, offset, string) {
        for (let i = 0; i < string.length; i++) {
            view.setUint8(offset + i, string.charCodeAt(i));
        }
    }

    // Create a download link for the audio
    async createDownloadLink(filename = 'ai-music') {
        const wavBuffer = await this.exportToWAV();
        if (!wavBuffer) return null;
        
        const blob = new Blob([wavBuffer], { type: 'audio/wav' });
        const url = URL.createObjectURL(blob);
        
        return {
            url,
            filename: `${filename}-${new Date().toISOString().slice(0, 10)}.wav`,
            cleanup: () => URL.revokeObjectURL(url)
        };
    }

    // Add to history
    addToHistory(params) {
        this.history.unshift({
            id: Date.now(),
            params,
            timestamp: new Date().toISOString()
        });
        
        // Keep only the most recent items
        if (this.history.length > this.MAX_HISTORY) {
            this.history.pop();
        }
    }

    // Get history
    getHistory() {
        return [...this.history];
    }

    // Event emitter functionality
    dispatchEvent(event) {
        if (typeof this.on === 'function') {
            this.on(event.type, event);
        }
    }
}

// Create a singleton instance
const audioProcessor = new AudioProcessor();

// Export for use in other modules
export default audioProcessor;
