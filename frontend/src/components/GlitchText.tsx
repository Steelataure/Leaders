import { cn } from "../utils/cn";

export const GlitchText = ({ text, className }: { text: string; className?: string }) => {
    return (
        <div className={cn("relative inline-block group", className)}>
            <span className="relative z-10">{text}</span>
            <span className="absolute top-0 left-0 -z-10 w-full h-full text-cyan-500 opacity-0 group-hover:opacity-100 group-hover:translate-x-[2px] transition-all duration-200 select-none">
                {text}
            </span>
            <span className="absolute top-0 left-0 -z-10 w-full h-full text-magenta-500 opacity-0 group-hover:opacity-100 group-hover:-translate-x-[2px] transition-all duration-200 select-none">
                {text}
            </span>
        </div>
    );
};
