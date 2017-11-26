const hours = new Date().getHours();
const day = new Date().getDay();

if((hours >= 23 || hours < 1) && day <=5) {
    document.querySelector('.poem').style.display = "block";
}