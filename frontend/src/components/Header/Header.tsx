interface HeaderProps {
    threatCount: number;
}

export function Header({threatCount}: HeaderProps) {
    return (
        <div
            className=" flex justify-between items-center p-6 bg-slate-800 text-white-500 rounded-bl-lg shadow-lg border-b border-slate-700">
            <h1 className="flex items-center text-2xl font-bold tracking-wider"><img
                src="/threat-intelligence-map.svg"
                alt="Logo"
                className="w-18 h-18 drop-shadow-md "/>Threat Intelligence Map</h1>
            <p className="text-slate-300 font-mono">
                Wykryto ataków: <span className="text-red-500 font-bold text-xl">{threatCount}</span>
            </p>
        </div>
    )
}