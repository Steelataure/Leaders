// import { useEffect, useState } from "react";

const SYSTEM_MESSAGES = [
    "SYSTEME: EN LIGNE",
    "CONNEXION: SÉCURISÉE (V2.1)",
    "SERVEUR: EUROPE-1 (LATENCE: 24ms)",
    "MÉTÉO: PLUIE ACIDE SUR SECTEUR 7",
    "ALERT: INTRUSION DÉTECTÉE DANS LE SECTEUR 4 (NEUTRALISÉE)",
    "SCAN: AUCUNE MENACE IMMÉDIATE",
    "PROTOCOL: LEADERS ACTIVÉ",
    "RECRUTEMENT: OUVERT AUX OFFICIERS DE RANG OR+",
];

export const SystemStatus = () => {
    // const [msgIndex, setMsgIndex] = useState(0);

    return (
        <div className="fixed bottom-0 left-0 w-full bg-black/80 backdrop-blur-md border-t border-white/10 z-50 h-8 flex items-center overflow-hidden font-mono text-xs">
            <div className="w-full flex whitespace-nowrap animate-marquee">
                {/* Duplicate messages for infinite scroll illusion */}
                {[...SYSTEM_MESSAGES, ...SYSTEM_MESSAGES, ...SYSTEM_MESSAGES].map((msg, i) => (
                    <span key={i} className="mx-8 text-cyan-500/60 uppercase tracking-widest flex items-center gap-2">
                        <span className="w-1.5 h-1.5 bg-cyan-500/40 rounded-full animate-pulse"></span>
                        {msg}
                    </span>
                ))}
            </div>

            <style>{`
                @keyframes marquee {
                    0% { transform: translateX(0); }
                    100% { transform: translateX(-50%); }
                }
                .animate-marquee {
                    animation: marquee 60s linear infinite;
                }
            `}</style>
        </div>
    );
};
