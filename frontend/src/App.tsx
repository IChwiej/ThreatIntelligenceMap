import {useState} from 'react';
import {Header} from "./components/Header/Header";
import {Sidebar} from "./components/Sidebar/Sidebar";
import {ThreatMap} from "./components/ThreatMap/ThreatMap.tsx";
import type {ThreatRecord} from "./types";

function App() {
    const [threats, setThreats] = useState<ThreatRecord[]>([]);

    return (
        <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
            <Header threatCount={threats.length}/>

            <main className="flex flex-row flex-1 overflow-hidden">
                <div className="flex-1 p-6 bg-transparent">
                    <div className="h-full w-full bg-slate-800 rounded-lg border border-slate-700 shadow-inner">
                        <ThreatMap threats={threats} onThreatsUpdate={setThreats}/>
                    </div>
                </div>

                <Sidebar threats={threats}/>
            </main>
        </div>
    );
}

export default App;