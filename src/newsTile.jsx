import { useEffect, useState } from "react";
const NEWS_API_KEY = import.meta.env.VITE_NEWS_API_SECRET;

function NewsTile() {
  const [newsData, setNewsData] = useState(null);

  /* useEffect(() => {
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
*/
  return (
    <>
      <div className="news-tile-container">
        <div className="news-tile"></div>
        <div className="news-article-container">
          <div className="news-article-1">
            <div className="source"></div>
          </div>
          <div className="news-article-1">
            <div className="source"></div>
          </div>
          <div className="news-article-1">
            <div className="source"></div>
          </div>
        </div>
      </div>
    </>
  );
}

export default NewsTile;
