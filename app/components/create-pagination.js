module.exports = (total, page = 1, order, perPage) => {
    const pages = 3;
    const last = Math.ceil( total / perPage );
    const prev = page - pages - Math.max(page + pages - last, 0);
    const start = prev > 1 ? prev : 1;
    const next = page + pages + Math.max(pages - page + 1, 0);
    const end = next < last ? next : last;
    const params = `href=/?order=${order}&page=`;
    let html = `<li class="pagination-prev">${page !== 1 ? `<a rel="prev" ${params + (page - 1)}></a>` : ''}</li>`;
    if (start > 1) {
        html += `<li class="pagination-item"><a ${params + 1} rel="prev">1</a>`;
        if(start !== 2) {
            html += '<li class="pagination-period">'
        }
    }
    for ( let i = start; i < page; i ++) {
        html += `<li class="pagination-item"><a rel="prev" ${params + i}>${i}</a>`;
    }
    html += `<li class="pagination-current">${page}`;
    for (let i = page + 1 ; i <= end; i ++) {
        html += `<li class="pagination-item"><a rel="next" ${params + i}>${i}</a>`;
    }
    if (end < last) {
        if(end !== last - 1) {
            html += '<li class="pagination-period">'
        }
        html += `<li class="pagination-item"><a ${params + last} rel="next">${last}</a>`;
    }
    html += `<li class="pagination-next">${page !== last ? `<a ${params + (page + 1)} rel="next"></a>` : ''}</li>`;
    return html;
}