// More advanced visualizer implementation
class AudioVisualizer {
    constructor(canvasId, audioContext, audioBuffer) {
        this.canvas = document.getElementById(canvasId);
        this.ctx = this.canvas.getContext('2d');
        this.audioContext = audioContext;
        this.audioBuffer = audioBuffer;
        this.analyser = audioContext.createAnalyser();
        this.dataArray = new Uint8Array(this.analyser.frequencyBinCount);
        
        this.setup();
    }
    
    setup() {
        // Set canvas dimensions
        this.canvas.width = this.canvas.offsetWidth;
        this.canvas.height = this.canvas.offsetHeight;
        
        // Connect audio nodes
        const source = this.audioContext.createBufferSource();
        source.buffer = this.audioBuffer;
        source.connect(this.analyser);
        this.analyser.connect(this.audioContext.destination);
        
        // Start visualization
        this.draw();
    }
    
    draw() {
        requestAnimationFrame(() => this.draw());
        
        this.analyser.getByteFrequencyData(this.dataArray);
        
        const width = this.canvas.width;
        const height = this.canvas.height;
        const barWidth = (width / this.analyser.frequencyBinCount) * 2.5;
        
        this.ctx.clearRect(0, 0, width, height);
        
        let x = 0;
        for (let i = 0; i < this.analyser.frequencyBinCount; i++) {
            const barHeight = (this.dataArray[i] / 255) * height;
            
            // Create gradient
            const gradient = this.ctx.createLinearGradient(0, height - barHeight, 0, height);
            gradient.addColorStop(0, `hsl(${i / 3}, 100%, 50%)`);
            gradient.addColorStop(1, `hsl(${i / 3}, 100%, 20%)`);
            
            this.ctx.fillStyle = gradient;
            this.ctx.fillRect(x, height - barHeight, barWidth, barHeight);
            
            x += barWidth + 1;
        }
    }
}

// Initialize visualizer when audio is generated
function initVisualizer(audioBuffer) {
    new AudioVisualizer('visualizer', appState.audioContext, audioBuffer);
}
