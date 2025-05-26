import { useEffect, useState } from "react";

function NewsTile() {
  const [newsData, setNewsData] = useState(null);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const res = await fetch("http://localhost:3002/api/news");
        const data = await res.json();
        setNewsData(data);
      } catch (err) {
        console.error("error fetching news data", err);
      }
    };

    fetchNews();
  }, []);

  return (
    <>
      <div className="news-tile-container">
        {newsData?.data?.map((article, index) => (
          <div className="news-article-container" key={article.uuid}>
            <div className="news-img-container">
              <img
                className="news-img"
                src={article.image_url}
                alt={article.title}
              />
            </div>

            <div className="news-text">
              <h3 className="news-headline">{article.title}</h3>
              <p className="news-article-desc">{article.description}</p>
              <p className="news-source">{article.source}</p>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}

export default NewsTile;
