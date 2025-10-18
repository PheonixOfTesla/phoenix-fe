// shaders.js - Phoenix JARVIS Visual Effects Pipeline

class ShaderEffects {
    constructor() {
        this.canvas = null;
        this.gl = null;
        this.programs = {};
        this.uniforms = {};
        this.animationFrame = null;
        this.startTime = Date.now();
        this.glitchIntensity = 0;
        this.scanlineOffset = 0;
    }

    init() {
        console.log('🎨 Initializing Shader Effects...');
        this.createWebGLCanvas();
        
        if (this.gl) {
            this.setupShaders();
            this.setupQuad();
            this.animate();
        }
    }

    createWebGLCanvas() {
        // Create WebGL canvas overlay
        this.canvas = document.createElement('canvas');
        this.canvas.style.position = 'fixed';
        this.canvas.style.top = '0';
        this.canvas.style.left = '0';
        this.canvas.style.width = '100%';
        this.canvas.style.height = '100%';
        this.canvas.style.pointerEvents = 'none';
        this.canvas.style.zIndex = '50';
        this.canvas.style.mixBlendMode = 'screen';
        document.body.appendChild(this.canvas);

        // Get WebGL context
        this.gl = this.canvas.getContext('webgl') || this.canvas.getContext('experimental-webgl');
        
        if (!this.gl) {
            console.warn('WebGL not supported, falling back to CSS effects');
            this.fallbackEffects();
            return;
        }

        this.resize();
        window.addEventListener('resize', () => this.resize());
    }

    resize() {
        this.canvas.width = window.innerWidth;
        this.canvas.height = window.innerHeight;
        if (this.gl) {
            this.gl.viewport(0, 0, this.canvas.width, this.canvas.height);
        }
    }

    setupShaders() {
        // Holographic shader
        this.programs.hologram = this.createShaderProgram(
            this.vertexShaderSource(),
            this.hologramFragmentShader()
        );

        // Scan lines shader
        this.programs.scanlines = this.createShaderProgram(
            this.vertexShaderSource(),
            this.scanlinesFragmentShader()
        );

        // Energy field shader
        this.programs.energy = this.createShaderProgram(
            this.vertexShaderSource(),
            this.energyFieldFragmentShader()
        );

        // Set active program
        this.activeProgram = this.programs.hologram;
        this.gl.useProgram(this.activeProgram);
    }

    createShaderProgram(vertexSource, fragmentSource) {
        const gl = this.gl;
        
        // Create vertex shader
        const vertexShader = gl.createShader(gl.VERTEX_SHADER);
        gl.shaderSource(vertexShader, vertexSource);
        gl.compileShader(vertexShader);
        
        if (!gl.getShaderParameter(vertexShader, gl.COMPILE_STATUS)) {
            console.error('Vertex shader error:', gl.getShaderInfoLog(vertexShader));
            return null;
        }

        // Create fragment shader
        const fragmentShader = gl.createShader(gl.FRAGMENT_SHADER);
        gl.shaderSource(fragmentShader, fragmentSource);
        gl.compileShader(fragmentShader);
        
        if (!gl.getShaderParameter(fragmentShader, gl.COMPILE_STATUS)) {
            console.error('Fragment shader error:', gl.getShaderInfoLog(fragmentShader));
            return null;
        }

        // Create program
        const program = gl.createProgram();
        gl.attachShader(program, vertexShader);
        gl.attachShader(program, fragmentShader);
        gl.linkProgram(program);
        
        if (!gl.getProgramParameter(program, gl.LINK_STATUS)) {
            console.error('Program link error:', gl.getProgramInfoLog(program));
            return null;
        }

        return program;
    }

    vertexShaderSource() {
        return `
            attribute vec2 a_position;
            varying vec2 v_texCoord;
            
            void main() {
                gl_Position = vec4(a_position, 0.0, 1.0);
                v_texCoord = a_position * 0.5 + 0.5;
            }
        `;
    }

    hologramFragmentShader() {
        return `
            precision mediump float;
            
            varying vec2 v_texCoord;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_intensity;
            
            vec3 hsv2rgb(vec3 c) {
                vec4 K = vec4(1.0, 2.0 / 3.0, 1.0 / 3.0, 3.0);
                vec3 p = abs(fract(c.xxx + K.xyz) * 6.0 - K.www);
                return c.z * mix(K.xxx, clamp(p - K.xxx, 0.0, 1.0), c.y);
            }
            
            void main() {
                vec2 uv = v_texCoord;
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(uv, center);
                
                // Holographic rings
                float rings = sin(dist * 50.0 - u_time * 2.0) * 0.5 + 0.5;
                rings *= smoothstep(0.8, 0.0, dist);
                
                // Color shift
                vec3 color = hsv2rgb(vec3(0.5 + sin(u_time * 0.5) * 0.1, 0.8, 1.0));
                
                // Pulse effect
                float pulse = sin(u_time * 3.0) * 0.2 + 0.8;
                
                // Grid lines
                float gridX = step(0.98, fract(uv.x * 20.0));
                float gridY = step(0.98, fract(uv.y * 20.0));
                float grid = max(gridX, gridY) * 0.1;
                
                // Combine effects
                float alpha = (rings * pulse + grid) * u_intensity * 0.3;
                
                gl_FragColor = vec4(color * alpha, alpha);
            }
        `;
    }

    scanlinesFragmentShader() {
        return `
            precision mediump float;
            
            varying vec2 v_texCoord;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_scanlineOffset;
            
            void main() {
                vec2 uv = v_texCoord;
                
                // Moving scan line
                float scanline = smoothstep(0.0, 0.1, abs(sin(uv.y * 200.0 + u_time * 2.0)));
                
                // Horizontal interference
                float interference = sin(uv.y * 500.0 + u_time * 10.0) * 0.04;
                
                // Vertical scan
                float scan = smoothstep(0.98, 1.0, sin(uv.y * 2.0 + u_scanlineOffset));
                
                // Combine
                float intensity = scanline * 0.05 + scan * 0.1;
                vec3 color = vec3(0.0, 1.0, 1.0);
                
                gl_FragColor = vec4(color * intensity, intensity);
            }
        `;
    }

    energyFieldFragmentShader() {
        return `
            precision mediump float;
            
            varying vec2 v_texCoord;
            uniform float u_time;
            uniform vec2 u_resolution;
            uniform float u_energy;
            
            float noise(vec2 p) {
                return sin(p.x * 10.0) * sin(p.y * 10.0);
            }
            
            void main() {
                vec2 uv = v_texCoord;
                vec2 center = vec2(0.5, 0.5);
                float dist = distance(uv, center);
                
                // Energy field
                float field = 0.0;
                for(float i = 1.0; i < 5.0; i++) {
                    vec2 p = uv * i + u_time * 0.1 * i;
                    field += noise(p) / i;
                }
                field = abs(field);
                field *= smoothstep(0.5, 0.0, dist);
                
                // Plasma effect
                vec3 color = vec3(0.0, field * u_energy, field * u_energy * 1.5);
                
                // Energy particles
                float particles = 0.0;
                for(float i = 0.0; i < 6.28; i += 0.5) {
                    vec2 particlePos = center + vec2(cos(i + u_time), sin(i + u_time)) * 0.3;
                    float particleDist = distance(uv, particlePos);
                    particles += smoothstep(0.02, 0.0, particleDist) * 0.5;
                }
                
                color += vec3(0.0, particles, particles) * u_energy;
                
                gl_FragColor = vec4(color, field * 0.3);
            }
        `;
    }

    setupQuad() {
        const gl = this.gl;
        
        // Create a full-screen quad
        const positions = new Float32Array([
            -1, -1,
             1, -1,
            -1,  1,
             1,  1,
        ]);
        
        const buffer = gl.createBuffer();
        gl.bindBuffer(gl.ARRAY_BUFFER, buffer);
        gl.bufferData(gl.ARRAY_BUFFER, positions, gl.STATIC_DRAW);
        
        const positionLocation = gl.getAttribLocation(this.activeProgram, 'a_position');
        gl.enableVertexAttribArray(positionLocation);
        gl.vertexAttribPointer(positionLocation, 2, gl.FLOAT, false, 0, 0);
    }

    animate() {
        const gl = this.gl;
        const time = (Date.now() - this.startTime) / 1000;
        
        // Clear canvas
        gl.clearColor(0, 0, 0, 0);
        gl.clear(gl.COLOR_BUFFER_BIT);
        
        // Enable blending for transparency
        gl.enable(gl.BLEND);
        gl.blendFunc(gl.SRC_ALPHA, gl.ONE);
        
        // Update uniforms for active program
        this.updateUniforms(time);
        
        // Draw quad
        gl.drawArrays(gl.TRIANGLE_STRIP, 0, 4);
        
        // Cycle through effects periodically
        if (Math.floor(time) % 10 === 0 && Math.floor(time) !== this.lastEffectSwitch) {
            this.switchEffect();
            this.lastEffectSwitch = Math.floor(time);
        }
        
        // Random glitch effect
        if (Math.random() > 0.995) {
            this.triggerGlitch();
        }
        
        this.animationFrame = requestAnimationFrame(() => this.animate());
    }

    updateUniforms(time) {
        const gl = this.gl;
        
        // Time uniform
        const timeLocation = gl.getUniformLocation(this.activeProgram, 'u_time');
        gl.uniform1f(timeLocation, time);
        
        // Resolution uniform
        const resolutionLocation = gl.getUniformLocation(this.activeProgram, 'u_resolution');
        gl.uniform2f(resolutionLocation, this.canvas.width, this.canvas.height);
        
        // Program-specific uniforms
        if (this.activeProgram === this.programs.hologram) {
            const intensityLocation = gl.getUniformLocation(this.activeProgram, 'u_intensity');
            const intensity = window.Phoenix?.userData?.recoveryScore ? 
                window.Phoenix.userData.recoveryScore / 100 : 0.78;
            gl.uniform1f(intensityLocation, intensity);
        } else if (this.activeProgram === this.programs.scanlines) {
            const scanlineLocation = gl.getUniformLocation(this.activeProgram, 'u_scanlineOffset');
            this.scanlineOffset += 0.02;
            gl.uniform1f(scanlineLocation, this.scanlineOffset);
        } else if (this.activeProgram === this.programs.energy) {
            const energyLocation = gl.getUniformLocation(this.activeProgram, 'u_energy');
            const energy = window.Phoenix?.userData?.recoveryScore ? 
                window.Phoenix.userData.recoveryScore / 100 : 0.78;
            gl.uniform1f(energyLocation, energy);
        }
        
        // Glitch intensity
        if (this.glitchIntensity > 0) {
            this.glitchIntensity -= 0.05;
            this.applyGlitchEffect();
        }
    }

    switchEffect() {
        const effects = Object.keys(this.programs);
        const currentIndex = effects.indexOf(Object.keys(this.programs).find(
            key => this.programs[key] === this.activeProgram
        ));
        const nextIndex = (currentIndex + 1) % effects.length;
        
        this.activeProgram = this.programs[effects[nextIndex]];
        this.gl.useProgram(this.activeProgram);
        this.setupQuad();
        
        console.log('🎨 Switched to effect:', effects[nextIndex]);
    }

    triggerGlitch() {
        this.glitchIntensity = 1;
        
        // Add CSS glitch effect
        document.body.style.animation = 'glitch 0.2s';
        setTimeout(() => {
            document.body.style.animation = '';
        }, 200);
    }

    applyGlitchEffect() {
        // Temporary canvas distortion
        this.canvas.style.transform = `translate(${Math.random() * 4 - 2}px, ${Math.random() * 4 - 2}px)`;
        
        setTimeout(() => {
            this.canvas.style.transform = '';
        }, 50);
    }

    fallbackEffects() {
        // CSS-only effects for non-WebGL browsers
        const style = document.createElement('style');
        style.textContent = `
            body::before {
                content: '';
                position: fixed;
                top: 0;
                left: 0;
                width: 100%;
                height: 100%;
                background: linear-gradient(
                    transparent 50%,
                    rgba(0, 255, 255, 0.03) 50%
                );
                background-size: 100% 4px;
                pointer-events: none;
                z-index: 50;
                animation: scanlines 8s linear infinite;
            }
            
            @keyframes glitch {
                0%, 100% { 
                    transform: translate(0);
                    filter: hue-rotate(0deg);
                }
                20% { 
                    transform: translate(-2px, 2px);
                    filter: hue-rotate(90deg);
                }
                40% { 
                    transform: translate(-2px, -2px);
                    filter: hue-rotate(180deg);
                }
                60% { 
                    transform: translate(2px, 2px);
                    filter: hue-rotate(270deg);
                }
                80% { 
                    transform: translate(2px, -2px);
                    filter: hue-rotate(360deg);
                }
            }
            
            .holographic {
                background: linear-gradient(
                    45deg,
                    transparent 30%,
                    rgba(0, 255, 255, 0.1) 50%,
                    transparent 70%
                );
                background-size: 200% 200%;
                animation: holographic-sweep 3s ease-in-out infinite;
            }
            
            @keyframes holographic-sweep {
                0% { background-position: 200% 200%; }
                100% { background-position: -200% -200%; }
            }
            
            .energy-glow {
                box-shadow: 
                    0 0 20px rgba(0, 255, 255, 0.5),
                    0 0 40px rgba(0, 255, 255, 0.3),
                    0 0 60px rgba(0, 255, 255, 0.1);
                animation: energy-pulse 2s ease-in-out infinite;
            }
            
            @keyframes energy-pulse {
                0%, 100% { opacity: 0.8; }
                50% { opacity: 1; }
            }
        `;
        document.head.appendChild(style);
        
        // Apply holographic class to reactor
        const reactor = document.querySelector('.reactor-core');
        if (reactor) {
            reactor.classList.add('holographic', 'energy-glow');
        }
    }

    setGlitchIntensity(value) {
        this.glitchIntensity = Math.max(0, Math.min(1, value));
    }

    destroy() {
        if (this.animationFrame) {
            cancelAnimationFrame(this.animationFrame);
        }
        if (this.canvas) {
            document.body.removeChild(this.canvas);
        }
        this.gl = null;
    }
}

// Initialize shaders when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.Shaders = new ShaderEffects();
    window.Shaders.init();
});

// Cleanup on page unload
window.addEventListener('beforeunload', () => {
    if (window.Shaders) {
        window.Shaders.destroy();
    }
});