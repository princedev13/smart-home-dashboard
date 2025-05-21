import { useEffect, useState } from "react";
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_SECRET;

function NewsTile() {
  const [newsData, setNewsData] = useState(null);

  /*
  useEffect(() => {
    fetch(
      "https://api.thenewsapi.com/v1/news/top?" +
        NEWS_API_KEY +
        "&locale=us&limit=3"
    )
      .then((response) => response.json())
      .then((data) => {
        setNewsData(data);
      })
      .catch((error) => {
        console.error("error fetching news data");
      }, []);
  });

  function setArticleData(newsData) {
    newsData.data;
  }
*/

  return (
    <>
      <div className="news-tile-container">
        <div className="news-title">
          <h2>News</h2>
        </div>

        {newsData?.data?.map((article, index) => (
          <div className="news-article-container" key={article.uuid}>
            <div className={`news-article${index}`}>
              <div className="news-img">
                <img src={article.image_url} />
              </div>
              <div className="news-headline">{article.title}</div>
              <div className="news-article-desc">{article.description}</div>
              <div className="news-source">{article.source}</div>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default NewsTile;
