import { QueryBox } from '@/components/queryBox/QueryBox';
import AudioPlayer from '@/components/AudioPlayer/AudioPlayer';
// Removed unused import: import TradingViewSymbolOverview from '@/components/ui/tradingview-widget/TradingViewSimpleChartWidget';
export default function Page() {
  return (
    // 将flex-grow和h-full应用到外层div，确保它占据所有可用空间
    <div className="h-full flex-grow flex flex-col">
      <header className="mb-8 mt-10 -pt-10 px-4 flex-shrink-0">
        <h1 className="text-5xl font-extrabold text-center w-full bg-gradient-to-r from-indigo-400 via-purple-400 to-indigo-400 text-transparent bg-clip-text">
          Stock Market Podcast & News Explorer
        </h1>
        <p className="text-center text-gray-400 mt-2">
          Search and discover podcasts with AI-powered insights
        </p>
      </header>

      {/* 修改这个div，让它有明确的高度 */}
      <div className="h-full flex-grow">
        <QueryBox />
      </div>


      {/* <div className="center mt-10">
          <h1 className="text-xl font-semibold text-center w-full bg-gradient-to-r from-red-400 to-yellow-300 text-transparent bg-clip-text">
            Admin only
          </h1>

          <div className="flex justify-center mt-3">
            <IndexingTrigger />
          </div>
        </div> */}
    </div>
  );
}
