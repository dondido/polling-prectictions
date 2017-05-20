module.exports = (media, created) => {
    if(media) {
        if(media.indexOf('youtube.com') === -1) {
            return `<figure class="question-tile-figure"><img itemprop="image" src="/uploads/${created}/${media}" alt="Poll image" class="question-image"/></figure>`; 
        }
        return `<iframe class="uploaded-video" src="${media}"></iframe>`;
    }
    return '';
}