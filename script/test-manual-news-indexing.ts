import { embeddingContentDocuments } from '../services/rag';
import { insertNewsTags } from '../utils/supabase/queries';
import { generateNewsTags } from '../services/tag-generator';
import { formatAlphaVantageDate } from '../services/alpha-vantage';
import { ContentDocument } from '../types/document';
import { AlphaVantage } from '../types/alphavantage'; // To type the mock data items

// Your provided sample news data
const mockNewsFeed: AlphaVantage.NewsItem[] = [
    {
        "title": "Investors Heavily Search ACM Research, Inc. (ACMR) : Here is What You Need to Know",
        "url": "https://www.zacks.com/stock/news/2467899/investors-heavily-search-acm-research-inc-acmr-here-is-what-you-need-to-know",
        "time_published": "20250513T130013",
        "authors": [
            "Zacks Equity Research"
        ],
        "summary": "ACM Research (ACMR) has been one of the stocks most watched by Zacks.com users lately. So, it is worth exploring what lies ahead for the stock.",
        "banner_image": "https://staticx-tuner.zacks.com/images/default_article_images/default101.jpg",
        "source": "Zacks Commentary",
        "category_within_source": "n/a",
        "source_domain": "www.zacks.com",
        "topics": [
            {
                "topic": "Earnings",
                "relevance_score": "0.999999"
            },
            {
                "topic": "Technology",
                "relevance_score": "1.0"
            },
            {
                "topic": "Financial Markets",
                "relevance_score": "0.5855"
            }
        ],
        "overall_sentiment_score": 0.230532,
        "overall_sentiment_label": "Somewhat-Bullish",
        "ticker_sentiment": [
            {
                "ticker": "ACMR",
                "relevance_score": "0.477606",
                "ticker_sentiment_score": "0.145013",
                "ticker_sentiment_label": "Neutral"
            }
        ]
    },
    {
        "title": "Here is What to Know Beyond Why Super Micro Computer, Inc. (SMCI) is a Trending Stock",
        "url": "https://www.zacks.com/stock/news/2466630/here-is-what-to-know-beyond-why-super-micro-computer-inc-smci-is-a-trending-stock",
        "time_published": "20250512T130016",
        "authors": [
            "Zacks Equity Research"
        ],
        "summary": "Zacks.com users have recently been watching Super Micro (SMCI) quite a bit. Thus, it is worth knowing the facts that could determine the stock\'s prospects.",
        "banner_image": "https://staticx-tuner.zacks.com/images/default_article_images/default26.jpg",
        "source": "Zacks Commentary",
        "category_within_source": "n/a",
        "source_domain": "www.zacks.com",
        "topics": [
            {
                "topic": "Earnings",
                "relevance_score": "0.999999"
            },
            {
                "topic": "Technology",
                "relevance_score": "1.0"
            },
            {
                "topic": "Financial Markets",
                "relevance_score": "0.5855"
            }
        ],
        "overall_sentiment_score": 0.318037,
        "overall_sentiment_label": "Somewhat-Bullish",
        "ticker_sentiment": [
            {
                "ticker": "SMCI",
                "relevance_score": "0.09989",
                "ticker_sentiment_score": "0.07532",
                "ticker_sentiment_label": "Neutral"
            }
        ]
    },
    {
        "title": "Snowflake Inc. (SNOW) Is a Trending Stock: Facts to Know Before Betting on It",
        "url": "https://www.zacks.com/stock/news/2466633/snowflake-inc-snow-is-a-trending-stock-facts-to-know-before-betting-on-it",
        "time_published": "20250512T130015",
        "authors": [
            "Zacks Equity Research"
        ],
        "summary": "Zacks.com users have recently been watching Snowflake (SNOW) quite a bit. Thus, it is worth knowing the facts that could determine the stock\'s prospects.",
        "banner_image": "https://staticx-tuner.zacks.com/images/default_article_images/default45.jpg",
        "source": "Zacks Commentary",
        "category_within_source": "n/a",
        "source_domain": "www.zacks.com",
        "topics": [
            {
                "topic": "Earnings",
                "relevance_score": "0.999999"
            },
            {
                "topic": "Technology",
                "relevance_score": "1.0"
            },
            {
                "topic": "Financial Markets",
                "relevance_score": "0.54554"
            }
        ],
        "overall_sentiment_score": 0.244123,
        "overall_sentiment_label": "Somewhat-Bullish",
        "ticker_sentiment": [
            {
                "ticker": "SNOW",
                "relevance_score": "0.524949",
                "ticker_sentiment_score": "0.15351",
                "ticker_sentiment_label": "Somewhat-Bullish"
            }
        ]
    },
    {
        "title": "AppLovin Corporation (APP) is Attracting Investor Attention: Here is What You Should Know",
        "url": "https://www.zacks.com/stock/news/2466632/applovin-corporation-app-is-attracting-investor-attention-here-is-what-you-should-know",
        "time_published": "20250512T130015",
        "authors": [
            "Zacks Equity Research"
        ],
        "summary": "Zacks.com users have recently been watching AppLovin (APP) quite a bit. Thus, it is worth knowing the facts that could determine the stock\'s prospects.",
        "banner_image": "https://staticx-tuner.zacks.com/images/default_article_images/default303.jpg",
        "source": "Zacks Commentary",
        "category_within_source": "n/a",
        "source_domain": "www.zacks.com",
        "topics": [
            {
                "topic": "Earnings",
                "relevance_score": "0.999999"
            },
            {
                "topic": "Technology",
                "relevance_score": "1.0"
            },
            {
                "topic": "Financial Markets",
                "relevance_score": "0.54554"
            }
        ],
        "overall_sentiment_score": 0.257498,
        "overall_sentiment_label": "Somewhat-Bullish",
        "ticker_sentiment": [
            {
                "ticker": "APP",
                "relevance_score": "0.485711",
                "ticker_sentiment_score": "0.200357",
                "ticker_sentiment_label": "Somewhat-Bullish"
            }
        ]
    },
    {
        "title": "Arista Networks, Inc. (ANET) Is a Trending Stock: Facts to Know Before Betting on It",
        "url": "https://www.zacks.com/stock/news/2466635/arista-networks-inc-anet-is-a-trending-stock-facts-to-know-before-betting-on-it",
        "time_published": "20250512T130014",
        "authors": [
            "Zacks Equity Research"
        ],
        "summary": "Arista Networks (ANET) has received quite a bit of attention from Zacks.com users lately. Therefore, it is wise to be aware of the facts that can impact the stock\'s prospects.",
        "banner_image": "https://staticx-tuner.zacks.com/images/default_article_images/default322.jpg",
        "source": "Zacks Commentary",
        "category_within_source": "n/a",
        "source_domain": "www.zacks.com",
        "topics": [
            {
                "topic": "Earnings",
                "relevance_score": "0.999999"
            },
            {
                "topic": "Technology",
                "relevance_score": "1.0"
            },
            {
                "topic": "Financial Markets",
                "relevance_score": "0.54554"
            }
        ],
        "overall_sentiment_score": 0.257528,
        "overall_sentiment_label": "Somewhat-Bullish",
        "ticker_sentiment": [
            {
                "ticker": "ANET",
                "relevance_score": "0.484798",
                "ticker_sentiment_score": "0.182281",
                "ticker_sentiment_label": "Somewhat-Bullish"
            }
        ]
    },
    {
        "title": "Is Trending Stock Shopify Inc. (SHOP) a Buy Now?",
        "url": "https://www.zacks.com/stock/news/2466642/is-trending-stock-shopify-inc-shop-a-buy-now",
        "time_published": "20250512T130012",
        "authors": [
            "Zacks Equity Research"
        ],
        "summary": "Recently, Zacks.com users have been paying close attention to Shopify (SHOP). This makes it worthwhile to examine what the stock has in store.",
        "banner_image": "https://staticx-tuner.zacks.com/images/default_article_images/default339.jpg",
        "source": "Zacks Commentary",
        "category_within_source": "n/a",
        "source_domain": "www.zacks.com",
        "topics": [
            {
                "topic": "Earnings",
                "relevance_score": "0.999999"
            },
            {
                "topic": "Technology",
                "relevance_score": "1.0"
            },
            {
                "topic": "Financial Markets",
                "relevance_score": "0.5855"
            }
        ],
        "overall_sentiment_score": 0.219452,
        "overall_sentiment_label": "Somewhat-Bullish",
        "ticker_sentiment": [
            {
                "ticker": "SHOP",
                "relevance_score": "0.524949",
                "ticker_sentiment_score": "0.137716",
                "ticker_sentiment_label": "Neutral"
            }
        ]
    }
];

async function main() {
  console.log("Starting manual news indexing test...");
  const allNewsDocsToEmbed: ContentDocument[] = [];

  try {
    for (const item of mockNewsFeed) {
      console.log(`Processing news item: \"${item.title}\"`);
      const summary = item.summary || '';
      
      console.log(`  Generating tags for summary: \"${summary.substring(0, 50)}...\"`);
      const tags = await generateNewsTags(summary);
      console.log(`  Generated tags: ${tags.join(', ') || 'No tags generated'}`);

      if (tags && tags.length > 0) {
        console.log('  Inserting tags into tags_collection...');
        await insertNewsTags(tags);
        console.log('  Tags inserted.');
      }

      const contentDoc: ContentDocument = {
        content: summary,
        title: item.title,
        source_url: item.url,
        upload_time: item.time_published 
            ? new Date(formatAlphaVantageDate(item.time_published)).toISOString() 
            : new Date().toISOString(),
        author: item.authors?.length > 0 ? item.authors.join(', ') : item.source,
        source_type: 'news',
        tags: tags, // Tags generated by generateNewsTags
        description: summary,
        imageUrl: item.banner_image,
        raw_data: item, // Store the original AlphaVantage.NewsItem object
      };
      allNewsDocsToEmbed.push(contentDoc);
      console.log(`  News item \"${item.title}\" processed and added for embedding.`);
    }

    if (allNewsDocsToEmbed.length > 0) {
      console.log(`\nEmbedding ${allNewsDocsToEmbed.length} processed news documents...`);
      const embeddingResult = await embeddingContentDocuments(allNewsDocsToEmbed);
      console.log(`Embedding complete. Result: ${JSON.stringify(embeddingResult)}`);
    } else {
      console.log("No news documents were processed to embed.");
    }

    console.log("\nManual news indexing test finished successfully!");

  } catch (error) {
    console.error("Error during manual news indexing test:", error);
  }
}

main(); 