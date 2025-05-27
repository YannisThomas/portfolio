let slideIndex = 0;
let isFullscreen = false;

// Attendre que le DOM soit chargé
document.addEventListener('DOMContentLoaded', function() {
  console.log('Script chargé');
  showSlides();
  
  // Gestion du bouton plein écran
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  if (fullscreenBtn) {
    fullscreenBtn.addEventListener('click', function() {
      console.log('Bouton cliqué');
      if (!isFullscreen) {
        enterFullscreen();
      } else {
        exitFullscreen();
      }
    });
  }
});

// Contrôles clavier
document.addEventListener('keydown', function(event) {
  if (event.key === 'ArrowLeft') {
    console.log('Flèche gauche pressée');
    plusDiapo(-1);
  } else if (event.key === 'ArrowRight') {
    console.log('Flèche droite pressée');
    plusDiapo(1);
  } else if (event.key === 'Escape' && isFullscreen) {
    exitFullscreen();
  }
});

function plusDiapo(n) {
  showSlides(slideIndex += n);
}

function currentSlide(n) {
  showSlides(slideIndex = n);
}

function showSlides() {
  let i;
  
  // Gérer les slides normaux
  const slides = document.getElementsByClassName("diapo");
  if (slideIndex >= slides.length) {slideIndex = 0}    
  if (slideIndex < 0) {slideIndex = slides.length - 1}
  for (i = 0; i < slides.length; i++) {
      slides[i].style.display = "none";  
  }
  slides[slideIndex].style.display = "block";
  
  // Gérer l'image en plein écran si actif
  if (isFullscreen) {
    const fullscreenImage = document.getElementById('fullscreen-current-image');
    if (fullscreenImage) {
      const slides = document.getElementsByClassName("diapo");
      const currentSlide = slides[slideIndex];
      fullscreenImage.src = currentSlide.src;
      fullscreenImage.alt = currentSlide.alt;
    }
  }
}

function enterFullscreen() {
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  
  // Créer un overlay plein écran
  const fullscreenOverlay = document.createElement('div');
  fullscreenOverlay.className = 'fullscreen-overlay';
  fullscreenOverlay.id = 'fullscreen-overlay';
  
  // Créer le conteneur pour l'image unique
  const imageContainer = document.createElement('div');
  imageContainer.className = 'fullscreen-image-container';
  
  // Créer l'image actuelle
  const currentImage = document.createElement('img');
  currentImage.className = 'fullscreen-image';
  currentImage.id = 'fullscreen-current-image';
  
  // Récupérer l'image actuellement affichée
  const slides = document.getElementsByClassName("diapo");
  const currentSlide = slides[slideIndex];
  currentImage.src = currentSlide.src;
  currentImage.alt = currentSlide.alt;
  
  imageContainer.appendChild(currentImage);
  
  // Créer les zones de navigation
  const navigationZones = document.createElement('div');
  navigationZones.className = 'navigation-zones';
  
  const zoneGauche = document.createElement('div');
  zoneGauche.className = 'zone-gauche';
  zoneGauche.onclick = () => plusDiapo(-1);
  
  const zoneDroite = document.createElement('div');
  zoneDroite.className = 'zone-droite';
  zoneDroite.onclick = () => plusDiapo(1);
  
  navigationZones.appendChild(zoneGauche);
  navigationZones.appendChild(zoneDroite);
  
  fullscreenOverlay.appendChild(imageContainer);
  fullscreenOverlay.appendChild(navigationZones);
  
  document.body.appendChild(fullscreenOverlay);
  fullscreenBtn.textContent = 'Quitter plein écran';
  isFullscreen = true;
}

function exitFullscreen() {
  const fullscreenOverlay = document.getElementById('fullscreen-overlay');
  const fullscreenBtn = document.getElementById('fullscreen-btn');
  
  if (fullscreenOverlay) {
    document.body.removeChild(fullscreenOverlay);
  }
  
  fullscreenBtn.textContent = 'Mode plein écran';
  isFullscreen = false;
  
  // Synchroniser l'affichage
  showSlides();
}
