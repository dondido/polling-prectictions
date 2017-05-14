module.exports = (media, created) => {
    if(media) {
        if(media.indexOf('youtube.com') === -1) {
            return `<img itemprop="image" src="/uploads/${created}/${media}" alt="Poll image" class="question-tile-image"/>`; 
        }
        return `<iframe class="uploaded-video" src="${media}"></iframe>`;
    }
    return '';
}