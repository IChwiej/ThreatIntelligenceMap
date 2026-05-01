import {Header} from "./components/Header/Header";
import {Sidebar} from "./components/Sidebar/Sidebar";
import {mockThreats} from "./mocks/mockData";

function App() {
    return (
        <div className="h-screen flex flex-col bg-slate-900 overflow-hidden">
            <Header threatCount={mockThreats.length}/>

            <main className="flex flex-row flex-1 overflow-hidden">

                <div className="flex-1 p-6 bg-transparent">
                    <div className="h-full w-full bg-slate-800 rounded-lg border border-slate-700 shadow-inner">
                        {/* Map component - someday */}
                        <div className="flex items-center justify-center h-full text-slate-500">
                            Tu kiedyś będzie mapa
                        </div>
                    </div>
                </div>

                <Sidebar threats={mockThreats}/>

            </main>
        </div>
    );
}

export default App