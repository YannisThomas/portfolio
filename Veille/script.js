document.addEventListener('DOMContentLoaded', () => {
    const rssUrl = 'https://www.google.fr/alerts/feeds/09722814644650195074/7436755338450439361';
    const newsContainer = document.getElementById('veille-container');

    fetch(`https://api.rss2json.com/v1/api.json?rss_url=${encodeURIComponent(rssUrl)}`)
        .then(response => response.json())
        .then(data => {
            data.items.forEach(item => {
                const newsItem = document.createElement('div');
                newsItem.className = 'news-item';

                const title = document.createElement('h3');
                title.textContent = stripHTML(item.title);
                title.textContent = item.title;
                newsItem.appendChild(title);

                const description = document.createElement('p');
                title.textContent = stripHTML(item.title);
                description.innerHTML = item.content;
                newsItem.appendChild(description);

                const link = document.createElement('a');
                link.href = item.link;
                link.textContent = 'Lire la suite';
                link.target = '_blank';
                newsItem.appendChild(link);

                newsContainer.appendChild(newsItem);
            });
        })
        .catch(error => console.error('Erreur:', error));
});

function stripHTML(html) {
    let doc = new DOMParser().parseFromString(html, 'text/html');
    return doc.body.textContent || "";
}
