const hours = new Date().getHours();

if(hours >= 23 || hours < 1) {
    document.querySelector('.poem').style.display = "block";
}