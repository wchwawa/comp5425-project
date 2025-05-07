import requests
import feedparser

def fetch_podcast_episodes(rss_url):
    """
    Fetches and parses a podcast RSS feed to extract episode information.

    Args:
        rss_url (str): The URL of the podcast's RSS feed.

    Returns:
        list: A list of dictionaries, where each dictionary contains
              information about an episode (e.g., title, link, published date, summary).
              Returns an empty list if fetching or parsing fails.
    """
    episodes = []
    try:
        # Fetch the RSS feed content
        response = requests.get(rss_url, timeout=10) # Added a timeout
        response.raise_for_status()  # Raise an exception for HTTP errors

        # Parse the feed
        feed = feedparser.parse(response.content)

        # Extract information for each episode
        for entry in feed.entries:
            episode_data = {
                'title': entry.get('title'),
                'link': entry.get('link'), # Often the webpage for the episode
                'published': entry.get('published'), # Publication date as a string
                'published_parsed': entry.get('published_parsed'), # Parsed time.struct_time
                'summary': entry.get('summary'),
                'description': entry.get('description'), # Can be same as summary or more detailed
                'audio_url': None
            }

            # Find the audio URL (can be in 'enclosures' or 'links' with type 'audio/mpeg')
            if 'enclosures' in entry:
                for enclosure in entry.enclosures:
                    if enclosure.get('type', '').startswith('audio'):
                        episode_data['audio_url'] = enclosure.get('href')
                        break # Take the first audio enclosure

            if not episode_data['audio_url'] and 'links' in entry:
                 for link in entry.links:
                    if link.get('type', '').startswith('audio'):
                        episode_data['audio_url'] = link.get('href')
                        break

            episodes.append(episode_data)

        return episodes

    except requests.exceptions.RequestException as e:
        print(f"Error fetching RSS feed: {e}")
        return []
    except Exception as e:
        print(f"Error parsing RSS feed: {e}")
        return []

# --- Example Usage ---

# 1. Get the RSS feed URL (e.g., using iTunes Search API or manually)

# Example: Using iTunes Search API to find the RSS feed for "The Daily"
def get_podcast_rss_url(podcast_name):
    try:
        search_url = f"https://itunes.apple.com/search?term={podcast_name.replace(' ', '+')}&entity=podcast&limit=1"
        response = requests.get(search_url, timeout=10)
        response.raise_for_status()
        data = response.json()
        if data['resultCount'] > 0:
            return data['results'][0].get('feedUrl')
        else:
            print(f"No podcast found with the name: {podcast_name}")
            return None
    except requests.exceptions.RequestException as e:
        print(f"Error searching for podcast: {e}")
        return None
    except Exception as e:
        print(f"Error processing search result: {e}")
        return None

podcast_name_to_search = "The Daily" # Example podcast
rss_feed_url = get_podcast_rss_url(podcast_name_to_search)

if rss_feed_url:
    print(f"Found RSS feed for '{podcast_name_to_search}': {rss_feed_url}")

    # 2. Fetch and parse the podcast episodes
    podcast_episodes = fetch_podcast_episodes(rss_feed_url)

    if podcast_episodes:
        print(f"\n--- Episodes for {podcast_name_to_search} ---")
        for i, episode in enumerate(podcast_episodes[:5], 1): # Print first 5 episodes
            print(f"\nEpisode {i}:")
            print(f"  Title: {episode.get('title')}")
            print(f"  Published: {episode.get('published')}")
            print(f"  Summary: {episode.get('summary', 'N/A')[:150]}...") # Print first 150 chars of summary
            print(f"  Audio URL: {episode.get('audio_url')}")
    else:
        print("Could not fetch or parse podcast episodes.")
else:
    print("Could not find RSS feed URL.")