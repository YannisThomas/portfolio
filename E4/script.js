let slideIndex = 0;
showSlides();

function plusDiapo(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides() {
  let i;
  const slides = document.getElementsByClassName("diapo");
  if (slideIndex >= slides.length) {slideIndex = 0}    
  if (slideIndex < 0) {slideIndex = slides.length - 1}
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";  
  }
  slides[slideIndex].style.display = "block";  
}
