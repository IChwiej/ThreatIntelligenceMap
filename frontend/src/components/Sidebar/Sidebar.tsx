import type {ThreatRecord} from "../../types";

interface SidebarProps {
    threats: ThreatRecord[];
}

export function Sidebar({threats}: SidebarProps) {
    const displayThreats = threats.slice(0, 100);

    return (
        <aside className="w-80 bg-gray-300 border-l border-slate-200 h-full flex flex-col shadow-xl">
            <div className="p-4 border-b border-slate-100">
                <h2 className="text-xl font-bold text-slate-800">Ostatnie ataki</h2>
            </div>

            <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3">
                {displayThreats.map((threat, index) => {
                    // @ts-ignore
                    const ip = threat.ipAddress || threat.ip_address || "Nieznane IP";
                    // @ts-ignore
                    const type = threat.threatType || threat.threat_type || "Nieznany";

                    return (
                        <div
                            key={`${ip}-${index}`}
                            className="p-3 bg-slate-50 rounded-lg border border-slate-200 hover:border-red-300 transition-all cursor-pointer group"
                        >
                            <p className="text-sm font-bold text-slate-900 group-hover:text-red-600">{ip}</p>
                            <p className="text-xs text-slate-500">{threat.location?.city}, {threat.location?.country}</p>
                            <div className="flex justify-between items-center mt-2">
                            <span
                                className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold uppercase">
                                {type}
                            </span>
                            </div>
                        </div>
                    );
                })}
            </div>
        </aside>
    );
}