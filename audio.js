class SoundEffects {
    constructor() {
        this.ctx = null;
        this.isMuted = false;
        this.sprayNode = null;
        this.sprayGain = null;
    }

    init() {
        if (!this.ctx) {
            const AudioContext = window.AudioContext || window.webkitAudioContext;
            if (AudioContext) {
                this.ctx = new AudioContext();
            }
        }
        if (this.ctx && this.ctx.state === 'suspended') {
            this.ctx.resume();
        }
    }

    startSpray() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        if (this.sprayNode) return; // already playing

        // Generate white noise for pressurized aerosol spray hiss
        const bufferSize = this.ctx.sampleRate * 2;
        const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
        const output = noiseBuffer.getChannelData(0);
        for (let i = 0; i < bufferSize; i++) {
            output[i] = Math.random() * 2 - 1;
        }

        const whiteNoise = this.ctx.createBufferSource();
        whiteNoise.buffer = noiseBuffer;
        whiteNoise.loop = true;

        // Bandpass filter for realistic aerosol hiss
        const bandpass = this.ctx.createBiquadFilter();
        bandpass.type = 'bandpass';
        bandpass.frequency.setValueAtTime(2800, this.ctx.currentTime);
        bandpass.Q.setValueAtTime(1.2, this.ctx.currentTime);

        // Highpass filter to remove rumble
        const highpass = this.ctx.createBiquadFilter();
        highpass.type = 'highpass';
        highpass.frequency.setValueAtTime(1400, this.ctx.currentTime);

        const gainNode = this.ctx.createGain();
        gainNode.gain.setValueAtTime(0.01, this.ctx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.25, this.ctx.currentTime + 0.08);

        whiteNoise.connect(bandpass);
        bandpass.connect(highpass);
        highpass.connect(gainNode);
        gainNode.connect(this.ctx.destination);

        whiteNoise.start();
        this.sprayNode = whiteNoise;
        this.sprayGain = gainNode;
    }

    stopSpray() {
        if (this.sprayGain && this.ctx) {
            try {
                this.sprayGain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.1);
                setTimeout(() => {
                    if (this.sprayNode) {
                        try {
                            this.sprayNode.stop();
                            this.sprayNode.disconnect();
                        } catch (e) {}
                        this.sprayNode = null;
                        this.sprayGain = null;
                    }
                }, 120);
            } catch (e) {
                this.sprayNode = null;
                this.sprayGain = null;
            }
        }
    }

    playKill() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        // Squelch / pop sound for bug elimination
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(320, this.ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(80, this.ctx.currentTime + 0.12);

        gain.gain.setValueAtTime(0.2, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.14);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.15);
    }

    playFlee() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        // Quick flutter / skitter sound
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(450, this.ctx.currentTime);
        osc.frequency.linearRampToValueAtTime(800, this.ctx.currentTime + 0.08);

        gain.gain.setValueAtTime(0.08, this.ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, this.ctx.currentTime + 0.09);

        osc.connect(gain);
        gain.connect(this.ctx.destination);

        osc.start();
        osc.stop(this.ctx.currentTime + 0.1);
    }

    playSuccess() {
        if (this.isMuted) return;
        this.init();
        if (!this.ctx) return;

        const now = this.ctx.currentTime;
        const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
        notes.forEach((freq, i) => {
            const osc = this.ctx.createOscillator();
            const gain = this.ctx.createGain();
            osc.type = 'sine';
            osc.frequency.setValueAtTime(freq, now + i * 0.08);
            gain.gain.setValueAtTime(0.15, now + i * 0.08);
            gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.08 + 0.25);

            osc.connect(gain);
            gain.connect(this.ctx.destination);

            osc.start(now + i * 0.08);
            osc.stop(now + i * 0.08 + 0.3);
        });
    }

    toggleMute() {
        this.isMuted = !this.isMuted;
        return this.isMuted;
    }
}

window.soundEffects = new SoundEffects();
