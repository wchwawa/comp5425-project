import TradingViewWidget from '@/components/TradingViewWidget';

export default function Page() {
  return (
    <div className="container mx-auto">
      {/* Ensures widgets are stacked vertically */}
      <div className="grid grid-cols-1 gap-1">
        {/* Container for TradingViewWidget - added height class here */}
        {/* You can adjust h-[500px] to your desired height, e.g., h-96, h-[60vh] */}
        <div className="p-1 bg-white rounded-lg shadow w-full h-full"> {/* Example: Fixed height */}
          <TradingViewWidget symbol="NASDAQ:AAPL" />
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h1 className="text-xl font-bold mb-4">Podcast Player</h1>
          <audio controls className="w-full">
            <source
              src="https://dts.podtrac.com/redirect.mp3/pdst.fm/e/pfx.vpixl.com/6qj4J/nyt.simplecastaudio.com/03d8b493-87fc-4bd1-931f-8a8e9b945d8a/episodes/f5f92542-16ca-4fa1-9df2-3f36808514f3/audio/128/default.mp3?aid=rss_feed&awCollectionId=03d8b493-87fc-4bd1-931f-8a8e9b945d8a&awEpisodeId=f5f92542-16ca-4fa1-9df2-3f36808514f3&feed=Sl5CSM3S"
              type="audio/mpeg"
            />
            Your browser does not support the audio element.
          </audio>
        </div>
      </div>
    </div>
  );
}