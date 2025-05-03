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
        <div className="news-title">
          <h2>News</h2>
        </div>
        <div className="news-article-container">
          <div className="news-img">
            <img src="" />
          </div>
          <div className="news-headline">headline</div>
          <div className="news-article-desc">descriptiondescription</div>
          <div className="news-source">source</div>
        </div>

        <div className="news-article-container">
          <div className="news-img">
            <img src="" />
          </div>
          <div className="news-headline">headline</div>
          <div className="news-article-desc">descriptiondescription</div>
          <div className="news-source">source</div>
        </div>

        <div className="news-article-container">
          <div className="news-img">
            <img src="" />
          </div>
          <div className="news-headline">headline</div>
          <div className="news-article-desc">descriptiondescription</div>
          <div className="news-source">source</div>
        </div>
      </div>
    </>
  );
}

export default NewsTile;
