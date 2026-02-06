/** @type {import('tailwindcss').Config} */
export default {
    content: [
        "./index.html",
        "./src/**/*.{js,ts,jsx,tsx}",
    ],
    theme: {
        container: {
            center: true,
            padding: "2rem",
            screens: {
                "2xl": "1400px",
            },
        },
        extend: {
            fontFamily: {
                orbitron: ["Orbitron", "monospace"],
                rajdhani: ["Rajdhani", "sans-serif"],
            },
            colors: {
                border: "hsl(var(--border))",
                input: "hsl(var(--input))",
                ring: "hsl(var(--ring))",
                background: "hsl(var(--background))",
                foreground: "hsl(var(--foreground))",
                primary: {
                    DEFAULT: "hsl(var(--primary))",
                    foreground: "hsl(var(--primary-foreground))",
                },
                secondary: {
                    DEFAULT: "hsl(var(--secondary))",
                    foreground: "hsl(var(--secondary-foreground))",
                },
                destructive: {
                    DEFAULT: "hsl(var(--destructive))",
                    foreground: "hsl(var(--destructive-foreground))",
                },
                muted: {
                    DEFAULT: "hsl(var(--muted))",
                    foreground: "hsl(var(--muted-foreground))",
                },
                accent: {
                    DEFAULT: "hsl(var(--accent))",
                    foreground: "hsl(var(--accent-foreground))",
                },
                popover: {
                    DEFAULT: "hsl(var(--popover))",
                    foreground: "hsl(var(--popover-foreground))",
                },
                card: {
                    DEFAULT: "hsl(var(--card))",
                    foreground: "hsl(var(--card-foreground))",
                },
                // Cyberpunk specific colors
                neon: {
                    cyan: "hsl(180, 100%, 50%)",
                    magenta: "hsl(320, 100%, 60%)",
                    yellow: "hsl(60, 100%, 50%)",
                    red: "hsl(0, 100%, 55%)",
                    green: "hsl(120, 100%, 50%)",
                },
                cyber: {
                    dark: "hsl(240, 10%, 3%)",
                    darker: "hsl(240, 15%, 6%)",
                    surface: "hsl(240, 15%, 10%)",
                    grid: "hsl(180, 100%, 25%)",
                },
            },
            borderRadius: {
                lg: "var(--radius)",
                md: "calc(var(--radius) - 2px)",
                sm: "calc(var(--radius) - 4px)",
            },
            boxShadow: {
                "neon-cyan": "0 0 10px hsl(180, 100%, 50% / 0.5), 0 0 20px hsl(180, 100%, 50% / 0.3), 0 0 40px hsl(180, 100%, 50% / 0.2)",
                "neon-magenta": "0 0 10px hsl(320, 100%, 60% / 0.5), 0 0 20px hsl(320, 100%, 60% / 0.3), 0 0 40px hsl(320, 100%, 60% / 0.2)",
                "neon-yellow": "0 0 10px hsl(60, 100%, 50% / 0.5), 0 0 20px hsl(60, 100%, 50% / 0.3), 0 0 40px hsl(60, 100%, 50% / 0.2)",
                "neon-red": "0 0 10px hsl(0, 100%, 55% / 0.5), 0 0 20px hsl(0, 100%, 55% / 0.3), 0 0 40px hsl(0, 100%, 55% / 0.2)",
                "cyber-glow": "0 0 30px hsl(180, 100%, 50% / 0.3), inset 0 0 30px hsl(180, 100%, 50% / 0.1)",
            },
            backgroundImage: {
                "cyber-grid": `
          linear-gradient(hsl(180, 100%, 50% / 0.1) 1px, transparent 1px),
          linear-gradient(90deg, hsl(180, 100%, 50% / 0.1) 1px, transparent 1px)
        `,
                "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                "gradient-neon": "linear-gradient(135deg, hsl(180, 100%, 50%), hsl(320, 100%, 60%))",
            },
            backgroundSize: {
                "grid-lg": "50px 50px",
                "grid-sm": "25px 25px",
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "pulse-neon": {
                    "0%, 100%": {
                        opacity: "1",
                        boxShadow: "0 0 10px hsl(180, 100%, 50% / 0.5), 0 0 20px hsl(180, 100%, 50% / 0.3)"
                    },
                    "50%": {
                        opacity: "0.8",
                        boxShadow: "0 0 20px hsl(180, 100%, 50% / 0.8), 0 0 40px hsl(180, 100%, 50% / 0.5)"
                    },
                },
                "flicker": {
                    "0%, 19.999%, 22%, 62.999%, 64%, 64.999%, 70%, 100%": {
                        opacity: "1",
                        filter: "drop-shadow(0 0 1px rgba(252, 211, 77)) drop-shadow(0 0 15px rgba(245, 158, 11)) drop-shadow(0 0 1px rgba(252, 211, 77))",
                    },
                    "20%, 21.999%, 63%, 63.999%, 65%, 69.999%": {
                        opacity: "0.4",
                        filter: "none",
                    },
                },
                "glitch": {
                    "0%": { transform: "translate(0)" },
                    "20%": { transform: "translate(-2px, 2px)" },
                    "40%": { transform: "translate(-2px, -2px)" },
                    "60%": { transform: "translate(2px, 2px)" },
                    "80%": { transform: "translate(2px, -2px)" },
                    "100%": { transform: "translate(0)" },
                },
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "pulse-neon": "pulse-neon 2s cubic-bezier(0.4, 0, 0.6, 1) infinite",
                "flicker": "flicker 3s linear infinite",
                "glitch": "glitch 0.3s cubic-bezier(.25, .46, .45, .94) both infinite",
            },
        },
    },
    plugins: [],
}
