function scrollLeft() {
    var container = document.getElementById('reviewContainer');
    container.scrollBy({
        top: 0,
        left: -300, // 每次滚动300px
        behavior: 'smooth'
    });
}

function scrollRight() {
    var container = document.getElementById('reviewContainer');
    container.scrollBy({
        top: 0,
        left: 300, // 每次滚动300px
        behavior: 'smooth'
    });
}