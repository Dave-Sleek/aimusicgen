// Configuration
const API_CONFIG = {
    STABLE_AUDIO: {
        BASE_URL: 'https://api.stableaudio.com/v1',
        ENDPOINTS: {
            GENERATE: '/generate',
        },
        DEFAULT_PARAMS: {
            model: 'stable-audio-1.0',
            output_format: 'wav',
        }
    },
    // Add other API configurations as needed
};

class AudioProcessor {
    constructor(apiKey) {
        // ... existing constructor code ...
        this.apiKey = apiKey;
    }

    // Updated to call real API
    async generateMusic(params) {
        try {
            // Validate parameters
            if (!this.validateParams(params)) {
                throw new Error('Invalid parameters');
            }
            
            // Show loading state
            this.dispatchEvent(new CustomEvent('generationStarted'));
            
            // Call the API
            const audioData = await this.callStableAudioAPI(params);
            
            // Decode the audio data
            this.audioBuffer = await this.decodeAudioData(audioData);
            
            // Add to history
            this.addToHistory(params);
            
            // Notify success
            this.dispatchEvent(new CustomEvent('generationComplete', {
                detail: { audioBuffer: this.audioBuffer }
            }));
            
            return this.audioBuffer;
        } catch (error) {
            console.error('Error generating music:', error);
            this.dispatchEvent(new CustomEvent('generationFailed', {
                detail: { error }
            }));
            throw error;
        }
    }

    // Call Stable Audio API
    async callStableAudioAPI(params) {
        const requestBody = {
            ...API_CONFIG.STABLE_AUDIO.DEFAULT_PARAMS,
            prompt: this.createPromptFromParams(params),
            duration: params.duration,
            // Add any API-specific parameters
        };
        
        const response = await fetch(`${API_CONFIG.STABLE_AUDIO.BASE_URL}${API_CONFIG.STABLE_AUDIO.ENDPOINTS.GENERATE}`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${this.apiKey}`
            },
            body: JSON.stringify(requestBody)
        });
        
        if (!response.ok) {
            const errorData = await response.json();
            throw new Error(errorData.message || 'API request failed');
        }
        
        return await response.arrayBuffer();
    }

    // Create a descriptive prompt from parameters
    createPromptFromParams(params) {
        const genreMap = {
            electronic: "electronic dance music with synthesizers and drum machines",
            ambient: "soothing ambient music with atmospheric pads and gentle textures",
            rock: "energetic rock music with electric guitars and drums",
            hiphop: "hip hop beat with 808 bass and crisp snares",
            classical: "orchestral classical music with strings and woodwinds",
            jazz: "smooth jazz with piano and saxophone",
            lofi: "chill lofi hip hop beat with vinyl crackle",
            synthwave: "retro synthwave with arpeggiated bass and bright leads"
        };
        
        const adjectives = [];
        if (params.energy > 70) adjectives.push("energetic", "powerful");
        if (params.energy < 30) adjectives.push("calm", "relaxing");
        if (params.happiness > 70) adjectives.push("happy", "uplifting");
        if (params.happiness < 30) adjectives.push("melancholic", "emotional");
        if (params.danceability > 70) adjectives.push("danceable", "rhythmic");
        if (params.complexity > 70) adjectives.push("complex", "layered");
        
        const uniqueAdjectives = [...new Set(adjectives)].join(", ");
        
        return `${uniqueAdjectives} ${genreMap[params.genre] || genreMap.electronic}, high quality production`;
    }

    // Validate generation parameters
    validateParams(params) {
        const validGenres = Object.keys(genreMap);
        if (!validGenres.includes(params.genre)) {
            return false;
        }
        
        if (params.duration < 5 || params.duration > 120) {
            return false;
        }
        
        // Validate mood parameters (0-100)
        const moodParams = ['energy', 'happiness', 'danceability', 'complexity'];
        for (const param of moodParams) {
            if (params[param] < 0 || params[param] > 100) {
                return false;
            }
        }
        
        return true;
    }

    // ... rest of the existing AudioProcessor class ...
}
