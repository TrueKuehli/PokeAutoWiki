let img = URL.createObjectURL(gfx.frontSprite);
let elt = document.createElement('img');
document.getElementById('front-layer').appendChild(elt);
elt.src = img;
